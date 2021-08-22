import { Logger, Provider, ScopeBehavior } from '@dandi/core'

import { WebSocketCloseCode, WebSocketConnection } from '@dandi/websockets'
import { json } from '@mp-server/shared'
import {
  ClientId,
  ClientMessage,
  ClientMessageType,
  ClientProfile,
  ClientRegistration,
} from '@mp-server/shared/client'
import { EntityDefRegistry } from '@mp-server/shared/entity'
import { ServerMessageType } from '@mp-server/shared/server'
import { filter, map, mergeMapTo, Observable, of, shareReplay, take, takeUntil, tap } from 'rxjs'
import { mergeMap, share } from 'rxjs/operators'

import { ClientSocketConnection, ClientSocketConnection$ } from './client-socket-connection'
import { GameServerConfig } from './game-server-config'
import { InitialEntities$ } from './inititial-entities'

function sendClientMessage(
  config: GameServerConfig,
  clientConn: ClientSocketConnection,
  initialEntities$: InitialEntities$,
  clientId: ClientId,
  profile: ClientProfile,
  logger: Logger,
): Observable<void> {
  return initialEntities$.pipe(
    take(1),
    mergeMap((initialEntities) =>
      clientConn.send({
        type: ServerMessageType.clientInit,
        config: {
          clientId,
          tickInterval: config.tickInterval,
          initialEntities,
          profile,
        },
      }),
    ),
    tap(() => logger.debug('sent clientInit', { clientId })),
    take(1),
  )
}

function clientSocketConnectionFactory(
  config: GameServerConfig,
  entityDefs: EntityDefRegistry,
  initialEntities$: InitialEntities$,
  conn: WebSocketConnection,
  logger: Logger,
): Observable<ClientSocketConnection> {
  const message$ = conn.message$.pipe(
    map((data) => json.parse<ClientMessage>(data.toString())),
    share(),
  )
  return message$.pipe(
    take(1),
    filter(function (msg: ClientMessage): msg is ClientRegistration {
      if (msg.type === ClientMessageType.register) {
        return true
      }
      logger.warn('first client message was not "register"', msg)
      conn.close(WebSocketCloseCode.internalError, 'First message must be "register"')
      return false
    }),
    mergeMap(({ clientId, profile }) => {
      if (!entityDefs.has(profile.entityDefKey)) {
        conn.close(WebSocketCloseCode.internalError, 'Invalid entityDefKey')
        return of(undefined)
      }
      const clientConn = new ClientSocketConnection(conn, clientId, profile, message$)
      logger.debug('received client registration', {
        clientId,
        profile,
      })
      const clientInit$ = sendClientMessage(config, clientConn, initialEntities$, clientId, profile, logger)
      return clientInit$.pipe(mergeMapTo(of(clientConn)))
    }),
    takeUntil(conn.close$),
    shareReplay(1),
  )
}

export function clientSocketConnectionProvider(
  conn: WebSocketConnection,
): Provider<Observable<ClientSocketConnection>> {
  return {
    provide: ClientSocketConnection$,
    useFactory: clientSocketConnectionFactory,
    deps: [GameServerConfig, EntityDefRegistry, InitialEntities$, WebSocketConnection, Logger],
    providers: [
      {
        provide: WebSocketConnection,
        useValue: conn,
        restrictScope: ScopeBehavior.perInjector,
      },
    ],
  }
}

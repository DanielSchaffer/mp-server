import { ClientRequest, IncomingMessage } from 'http'

import { Uuid } from '@dandi/common'

import { Injector, Logger, Provider, ScopeBehavior } from '@dandi/core'
import { WebSocketCloseCode, WebSocketConnection, WebSocketConnectionClose } from '@dandi/websockets'
import { defineScope, scopeInstanceFactory } from '@mp-server/common/dandi'
import { json } from '@mp-server/shared'
import {
  ClientId,
  ClientMessage,
  ClientMessageType,
  ClientProfile,
  ClientRegistration,
} from '@mp-server/shared/client'
import { EntityDefRegistry } from '@mp-server/shared/entity'
import { ServerMessage, ServerMessageType } from '@mp-server/shared/server'

import {
  filter,
  from,
  map,
  mergeMapTo,
  Observable,
  of,
  shareReplay,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs'
import { mergeMap, share } from 'rxjs/operators'

import WebSocket = require('ws')

import { GameServerConfig } from './game-server-config'
import { localToken } from './local-token'
import { ServerPlayerManager } from './server-player-manager'

function clientSocketConnectionFactory(
  config: GameServerConfig,
  entityDefs: EntityDefRegistry,
  conn: WebSocketConnection,
  playerManager: ServerPlayerManager,
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
    withLatestFrom(playerManager.connectedPlayers$),
    mergeMap(([{ clientId, profile }, connectedPlayers]) => {
      if (!entityDefs.has(profile.entityDefKey)) {
        conn.close(WebSocketCloseCode.internalError, 'Invalid entityDefKey')
        return of(undefined)
      }
      const clientConn = new ClientSocketConnection(conn, clientId, profile, message$)
      logger.debug('received client registration', {
        clientId,
        profile,
      })
      const clientInit$ = clientConn
        .send({
          type: ServerMessageType.clientInit,
          config: {
            clientId,
            tickInterval: config.tickInterval,
            initialEntities: connectedPlayers.map(({ clientId, entityDefKey }) => ({
              entityId: clientId,
              entityDefKey,
            })),
            profile,
          },
        })
        .pipe(
          tap(() => logger.debug('sent clientInit', { clientId })),
          take(1),
        )
      return clientInit$.pipe(mergeMapTo(of(clientConn)))
    }),
    takeUntil(conn.close$),
    shareReplay(1),
  )
}

export interface ClientConnectionScopeData {
  connectionId: Uuid
}

const CLIENT_CONNECTION_SCOPE = `${localToken.PKG}#Entity`
export const ClientConnectionScope = defineScope(CLIENT_CONNECTION_SCOPE)
export type ClientConnectionScope = typeof ClientConnectionScope

export interface ClientConnectionScopeInstance extends ClientConnectionScope, ClientConnectionScopeData {}

export const createClientConnectionScope = scopeInstanceFactory<
  ClientConnectionScope,
  ClientConnectionScopeInstance
>(ClientConnectionScope)

export const ClientSocketConnection$ = localToken.opinionated<Observable<ClientSocketConnection>>(
  'ClientSocketConnection$',
  {
    multi: false,
    restrictScope: ClientConnectionScope,
  },
)

export class ClientSocketConnection implements WebSocketConnection<ClientMessage> {
  public readonly connectionId: Uuid
  public readonly close$: Observable<WebSocketConnectionClose>
  public readonly message$: Observable<ClientMessage>
  public readonly open$: Observable<WebSocket>
  public readonly ping$: Observable<Buffer>
  public readonly pong$: Observable<Buffer>
  public readonly socket$: Observable<WebSocket>
  public readonly unexpectedResponse$: Observable<[ClientRequest, IncomingMessage]>
  public readonly upgrade$: Observable<IncomingMessage>
  public readonly request: IncomingMessage

  public static create(injector: Injector, conn: WebSocketConnection): Observable<ClientSocketConnection> {
    const scope = createClientConnectionScope(conn)
    const childInjector = injector.createChild(scope, [this.provider(conn)])
    return from(childInjector.inject(ClientSocketConnection$)).pipe(mergeMap((conn$) => conn$))
  }

  protected static provider(conn: WebSocketConnection): Provider<Observable<ClientSocketConnection>> {
    return {
      provide: ClientSocketConnection$,
      useFactory: clientSocketConnectionFactory,
      deps: [GameServerConfig, EntityDefRegistry, WebSocketConnection, ServerPlayerManager, Logger],
      providers: [
        {
          provide: WebSocketConnection,
          useValue: conn,
          restrictScope: ScopeBehavior.perInjector,
        },
      ],
    }
  }

  constructor(
    protected readonly conn: WebSocketConnection,
    public readonly clientId: ClientId,
    public readonly profile: ClientProfile,
    clientMessage$: Observable<ClientMessage>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message$, ...connProps } = conn
    Object.assign(this, connProps)
    this.message$ = clientMessage$
  }

  public close(code?: number, data?: string): void {
    this.conn.close(code, data)
  }

  public send(msg: ServerMessage | string): Observable<void> {
    const data = typeof msg === 'string' ? msg : json.stringify(msg)
    return this.conn.send(data)
  }
}

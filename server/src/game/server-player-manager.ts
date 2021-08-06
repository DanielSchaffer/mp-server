import { Inject, Injectable, Injector, Logger, Provider } from '@dandi/core'
import { WebSocketServer } from '@dandi/websockets'
import { hasOwnProperty } from '@mp-server/common'
import {
  Client,
  ClientControlStateChange,
  ClientDisconnect,
  ClientManager,
  ClientManagerFacade,
  ClientMessage,
  ClientMessageType,
  createClientScope,
} from '@mp-server/shared/client'
import {
  ControlledEntityTransformCalculation,
  createEntityScope,
  EntityControlState,
  EntityControlState$,
  EntityProfile,
  EntityTransformCalculationTrigger$,
  INITIAL_ENTITY_CONTROL_STATE,
} from '@mp-server/shared/entity'
import { createPlayerScope, Player } from '@mp-server/shared/player'
import { from, merge, Observable, of, pluck, shareReplay, startWith, takeUntil, tap } from 'rxjs'
import { filter, map, mapTo, mergeMap, scan, share } from 'rxjs/operators'

import { ClientSocketConnection } from './client-socket-connection'
import { ServerPlayer, serverPlayerProvider } from './server-player'

export type ServerPlayerClient = Client<ClientControlStateChange, ClientDisconnect>
export type ServerPlayerClientManager = ClientManager<ClientControlStateChange, ClientDisconnect>

export enum ConnectionEventType {
  connect = 'connect',
  disconnect = 'disconnect',
}

export interface ConnectionEvent {
  type: ConnectionEventType
  player: ServerPlayerClient
}

export function isConnectionEvent(obj: unknown): obj is ConnectionEvent {
  return (
    hasOwnProperty(obj, 'type', 'player') &&
    (obj.type === ConnectionEventType.connect || obj.type === ConnectionEventType.disconnect)
  )
}

@Injectable()
export class ServerPlayerManager {
  public readonly clientManagers$: Observable<ServerPlayerClientManager>
  public readonly players$: Observable<ServerPlayer>
  public readonly connect$: Observable<ServerPlayerClient>
  public readonly disconnect$: Observable<ServerPlayerClient>
  public readonly connectionEvent$: Observable<ConnectionEvent>
  public readonly connectedPlayers$: Observable<ServerPlayerClient[]>

  protected static initConnect(
    clientManagers$: Observable<ServerPlayerClientManager>,
    logger: Logger,
  ): Observable<ServerPlayerClient> {
    return clientManagers$.pipe(
      mergeMap((manager) => manager.client$),
      tap((client) => logger.debug('Client connected', { clientId: client.clientId })),
      share(),
    )
  }

  protected static initDisconnect(
    client$: Observable<ServerPlayerClient>,
    logger: Logger,
  ): Observable<ServerPlayerClient> {
    return client$.pipe(
      mergeMap((client) => client.disconnect$.pipe(mapTo(client))),
      tap((client) => logger.debug('Client disconnected', { clientId: client.clientId })),
      share(),
    )
  }

  protected static initConnectionEvent(
    connect$: Observable<ServerPlayerClient>,
    disconnect$: Observable<ServerPlayerClient>,
  ): Observable<ConnectionEvent> {
    const connectEvent$ = connect$.pipe(
      map((player) => ({
        type: ConnectionEventType.connect,
        player,
      })),
    )
    const disconnectEvent$ = disconnect$.pipe(
      map((player) => ({
        type: ConnectionEventType.disconnect,
        player,
      })),
    )
    return merge(connectEvent$, disconnectEvent$).pipe(share())
  }

  protected static initClientManagers(
    injector: Injector,
    server: WebSocketServer,
  ): Observable<ServerPlayerClientManager> {
    return server.connection$.pipe(
      mergeMap((conn) => ClientSocketConnection.create(injector, conn)),
      map((conn) => {
        const inputStateUpdateMessage$: Observable<ClientControlStateChange> = conn.message$.pipe(
          filter(function (msg: ClientMessage): msg is ClientControlStateChange {
            return msg.type === ClientMessageType.inputStateChange
          }),
        )
        const initialInputState: ClientControlStateChange = {
          type: ClientMessageType.inputStateChange,
          controlState: INITIAL_ENTITY_CONTROL_STATE,
        }
        const initialInputState$ = of(initialInputState)
        const message$ = merge(inputStateUpdateMessage$, initialInputState$).pipe(share())
        const disconnect$ = conn.close$.pipe(mapTo({ type: ClientMessageType.disconnect as const }))
        return ClientManagerFacade.create(
          injector,
          conn.clientId,
          conn.profile.entityDefKey,
          message$,
          disconnect$,
        )
      }),
      share(),
    )
  }

  protected static initServerPlayers(
    injector: Injector,
    connect$: Observable<ServerPlayerClient>,
  ): Observable<ServerPlayer> {
    return connect$.pipe(
      mergeMap((client) => {
        const clientScope = createClientScope(client)
        const clientInjector = injector.createChild(clientScope, [
          {
            provide: Client,
            useValue: client,
          },
        ])
        const entityScope = createEntityScope({
          entityId: client.clientId,
          entityDefKey: client.entityDefKey,
        })
        const childInjector = clientInjector.createChild(entityScope, this.serverPlayerEntityProviders(client))
        const playerScope = createPlayerScope({ playerId: client.clientId })
        const playerInjector = childInjector.createChild(playerScope, this.serverPlayerProviders())
        return from(playerInjector.inject(Player)).pipe(takeUntil(client.disconnect$), shareReplay(1))
      }),
      share(),
    )
  }

  protected static initConnectedServerPlayers(
    event$: Observable<ConnectionEvent>,
  ): Observable<ServerPlayerClient[]> {
    return event$.pipe(
      scan((result, event) => {
        if (event.type === ConnectionEventType.connect) {
          result[event.player.clientId] = event.player
        } else {
          delete result[event.player.clientId]
        }
        return result
      }, {} as { [clientId: string]: ServerPlayerClient }),
      map((players) => Object.values(players)),
      startWith([]),
      shareReplay(1),
    )
  }

  protected static serverPlayerEntityProviders(
    client: ServerPlayerClient,
  ): [
    Provider<Observable<EntityControlState>>,
    Provider<EntityTransformCalculationTrigger$>,
    Provider<EntityProfile>,
  ] {
    return [
      {
        provide: EntityControlState$,
        useValue: client.message$.pipe(pluck('controlState')),
      },
      ControlledEntityTransformCalculation,
      {
        provide: EntityProfile,
        useValue: {
          entityDefKey: client.entityDefKey,
        },
      },
    ]
  }

  protected static serverPlayerProviders(): [Provider<ServerPlayer>] {
    return [serverPlayerProvider()]
  }

  constructor(
    @Inject(WebSocketServer) protected readonly server: WebSocketServer,
    @Inject(Injector) protected readonly injector: Injector,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const clientManagers$ = ServerPlayerManager.initClientManagers(injector, server)
    const connect$ = ServerPlayerManager.initConnect(clientManagers$, logger)
    const disconnect$ = ServerPlayerManager.initDisconnect(connect$, logger)
    const connectionEvent$ = ServerPlayerManager.initConnectionEvent(connect$, disconnect$)
    const players$ = ServerPlayerManager.initServerPlayers(injector, connect$)
    const connectedPlayers$ = ServerPlayerManager.initConnectedServerPlayers(connectionEvent$)

    this.clientManagers$ = clientManagers$
    this.connect$ = connect$
    this.connectionEvent$ = connectionEvent$
    this.disconnect$ = disconnect$
    this.players$ = players$
    this.connectedPlayers$ = connectedPlayers$
  }
}

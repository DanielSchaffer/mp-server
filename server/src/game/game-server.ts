import { Inject, Injectable, Logger } from '@dandi/core'

import { WebSocketServer, WebSocketService } from '@dandi/websockets'
import { json, TickTiming$ } from '@mp-server/shared'
import { EntityStateMap, TickTimedEntityState } from '@mp-server/shared/entity'
import {
  EntityMessage,
  ServerMessage,
  ServerMessageType,
  TickUpdate,
  TickUpdate$,
  TickUpdateMessage,
} from '@mp-server/shared/server'
import { combineLatest, map, merge, mergeMap, Observable, of, shareReplay, takeUntil, withLatestFrom } from 'rxjs'
import { scan, share } from 'rxjs/operators'

import { GameServerConfig } from './game-server-config'
import {
  ConnectionEvent,
  ConnectionEventType,
  isConnectionEvent,
  ServerPlayerManager,
} from './server-player-manager'

type PlayerEvent = TickTimedEntityState | ConnectionEvent

@Injectable(WebSocketService)
export class GameServer implements WebSocketService {
  public readonly name = 'GameServer'

  public readonly entityStates$: Observable<EntityStateMap>
  public readonly tickUpdate$: TickUpdate$
  public readonly run$: Observable<never>

  protected static initPlayerStates(playerManager: ServerPlayerManager): Observable<EntityStateMap> {
    return playerManager.players$.pipe(
      mergeMap((player) => {
        const playerEvent$: Observable<PlayerEvent> = merge(player.state$, playerManager.connectionEvent$)
        return combineLatest([of(player), playerEvent$]).pipe(takeUntil(player.disconnect$))
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      scan((result, [player, event]) => {
        if (isConnectionEvent(event)) {
          if (event.type === ConnectionEventType.disconnect) {
            delete result[player.playerId]
          }
          return result
        }
        const { control, transform } = event
        result[player.playerId] = {
          control,
          transform,
        }
        return result
      }, {} as EntityStateMap),
      shareReplay(1),
    )
  }

  protected static initEntityEventMessage(
    tick$: TickTiming$,
    playerManager: ServerPlayerManager,
  ): Observable<EntityMessage> {
    return playerManager.connectionEvent$.pipe(
      withLatestFrom(tick$),
      map(([connectionEvent, tick]): EntityMessage => {
        const type =
          connectionEvent.type === ConnectionEventType.connect
            ? ServerMessageType.addEntity
            : ServerMessageType.removeEntity
        return {
          type,
          entityId: connectionEvent.player.clientId,
          tick,
        }
      }),
    )
  }

  protected static initTickUpdate(tick$: TickTiming$, entityStates$: Observable<EntityStateMap>): TickUpdate$ {
    return tick$.pipe(
      withLatestFrom(entityStates$),
      map(
        ([tick, entityStates]): TickUpdate => ({
          tick,
          entityStates,
        }),
      ),
      share(),
    )
  }

  protected static initTickUpdateMessage(tickUpdate$: TickUpdate$): Observable<TickUpdateMessage> {
    return tickUpdate$.pipe(
      map((update): TickUpdateMessage => Object.assign({ type: ServerMessageType.tick } as const, update)),
    )
  }

  protected static initSendMessage(
    server: WebSocketServer,
    message$: Observable<ServerMessage>,
  ): Observable<never> {
    return message$.pipe(mergeMap((message) => server.broadcast(json.stringify(message))))
  }

  constructor(
    @Inject(GameServerConfig) public readonly config: GameServerConfig,
    @Inject(WebSocketServer) protected readonly server: WebSocketServer,
    @Inject(ServerPlayerManager) protected readonly playerManager: ServerPlayerManager,
    @Inject(TickTiming$) public readonly tick$: TickTiming$,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const entityStates$ = GameServer.initPlayerStates(playerManager)
    const tickUpdate$ = GameServer.initTickUpdate(tick$, entityStates$)

    const entityEventMessage$ = GameServer.initEntityEventMessage(tick$, playerManager)
    const tickUpdateMessage$ = GameServer.initTickUpdateMessage(tickUpdate$)
    const message$ = merge(entityEventMessage$, tickUpdateMessage$)
    const sendMessage$ = GameServer.initSendMessage(server, message$)

    this.entityStates$ = entityStates$
    this.tickUpdate$ = tickUpdate$

    this.run$ = sendMessage$
  }
}

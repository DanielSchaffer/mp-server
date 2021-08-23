import { Inject, Injectable, Logger } from '@dandi/core'

import { WebSocketServer, WebSocketService } from '@dandi/websockets'
import { json, TickTiming$ } from '@mp-server/shared'
import { Entity, EntityEventType, SpawnedEntities$ } from '@mp-server/shared/entity'
import {
  EntityMessage,
  ServerMessage,
  ServerMessageType,
  TickUpdate$,
  TickUpdateMessage,
} from '@mp-server/shared/server'
import { filter, map, merge, mergeMap, Observable, withLatestFrom } from 'rxjs'

import { GameServerConfig } from './game-server-config'

@Injectable(WebSocketService)
export class GameServer implements WebSocketService {
  public readonly name = 'GameServer'
  public readonly run$: Observable<never>

  protected static initEntityEventMessage(
    tick$: TickTiming$,
    entities$: SpawnedEntities$,
  ): Observable<EntityMessage> {
    return entities$.pipe(
      mergeMap((entity) => entity.event$),
      filter((event) => event.type === EntityEventType.spawn || event.type === EntityEventType.despawn),
      withLatestFrom(tick$),
      map(([event, tick]): EntityMessage => {
        const { entityId, entityDefKey } = event.entity
        if (event.type === EntityEventType.spawn) {
          const entity: Entity = {
            entityId,
            entityDefKey,
          }
          return {
            type: ServerMessageType.addEntity,
            entity,
            tick,
            initialTransform: event.initialTransform,
          }
        }
        if (event.type === EntityEventType.despawn) {
          return {
            type: ServerMessageType.removeEntity,
            entityId,
            tick,
          }
        }
        return undefined
      }),
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
    @Inject(TickTiming$) public readonly tick$: TickTiming$,
    @Inject(TickUpdate$) public readonly tickUpdate$: TickUpdate$,
    @Inject(SpawnedEntities$) protected readonly entities$: SpawnedEntities$,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const entityEventMessage$ = GameServer.initEntityEventMessage(tick$, entities$)
    const tickUpdateMessage$ = GameServer.initTickUpdateMessage(tickUpdate$)
    const message$ = merge(entityEventMessage$, tickUpdateMessage$)
    const sendMessage$ = GameServer.initSendMessage(server, message$)

    this.tickUpdate$ = tickUpdate$

    this.run$ = sendMessage$
  }
}

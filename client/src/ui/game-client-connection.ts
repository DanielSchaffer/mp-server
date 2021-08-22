import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { json } from '@mp-server/shared'
import {
  Client,
  ClientConfig,
  ClientId,
  ClientMessage,
  ClientMessageType,
  ClientProfile,
  ClientScope,
} from '@mp-server/shared/client'
import {
  AddEntityMessage,
  ClientInit,
  RemoveEntityMessage,
  ServerMessage,
  ServerMessageType,
  TickUpdate$,
  TickUpdateMessage,
} from '@mp-server/shared/server'
import { filter, map, mapTo, mergeMap, Observable, pluck, share, shareReplay, take } from 'rxjs'

import { WebSocketClient } from '../lib/ws'

@Injectable(Client, RestrictScope(ClientScope))
export class GameClientConnection implements Client<ServerMessage, void> {
  public readonly open$: Observable<this>
  public readonly message$: Observable<ServerMessage>
  public readonly init$: Observable<ClientInit>
  public readonly config$: Observable<ClientConfig>
  public readonly disconnect$: Observable<void>

  public readonly tickUpdate$: TickUpdate$
  public readonly addEntity$: Observable<AddEntityMessage>
  public readonly removeEntity$: Observable<RemoveEntityMessage>
  public readonly entityDefKey: string

  constructor(
    @Inject(WebSocketClient) protected readonly ws: WebSocketClient,
    @Inject(ClientId) public readonly clientId: ClientId,
    @Inject(ClientProfile) public readonly profile: ClientProfile,
  ) {
    this.entityDefKey = profile.entityDefKey
    this.open$ = this.ws.open$.pipe(mapTo(this), shareReplay(1))
    this.disconnect$ = this.ws.close$
    const message$ = this.ws.message$.pipe(
      map((e) => json.parse<ServerMessage>(e.data.toString())),
      share(),
    )

    const register$ = this.open$.pipe(
      mergeMap(() =>
        this.send({
          type: ClientMessageType.register,
          clientId,
          profile,
        }),
      ),
      shareReplay(1),
    )

    this.init$ = register$.pipe(
      mergeMap(() => message$),
      filter(function (msg): msg is ClientInit {
        return msg.type === ServerMessageType.clientInit
      }),
      take(1),
      shareReplay(1),
    )

    this.config$ = this.init$.pipe(pluck('config'), shareReplay(1))

    this.message$ = this.config$.pipe(
      mergeMap(() => message$),
      share(),
    )

    this.addEntity$ = this.message$.pipe(
      filter(function (msg): msg is AddEntityMessage {
        return msg.type === ServerMessageType.addEntity
      }),
      share(),
    )

    this.removeEntity$ = this.message$.pipe(
      filter(function (msg): msg is RemoveEntityMessage {
        return msg.type === ServerMessageType.removeEntity
      }),
      share(),
    )

    this.tickUpdate$ = this.message$.pipe(
      filter(function (msg): msg is TickUpdateMessage {
        return msg.type === ServerMessageType.tick
      }),
      share(),
    )
  }

  public send(msg: ClientMessage): Observable<void> {
    return this.ws.send(json.stringify(msg))
  }
}

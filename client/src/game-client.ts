import { EntryPoint, Inject, Injectable, Injector, Logger } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import {
  ClientConfig,
  clientConfigProvider,
  ClientInit,
  ClientInputState,
  ClientInputStateChange,
  ClientMessage,
  ClientMessageType,
  json,
  ServerMessage,
  ServerMessageType,
  TickTiming,
  tickTimingProvider,
  TickUpdate,
  TickUpdateMessage,
  tickUpdateProvider
} from '@mp-server/shared'

import {
  combineLatest,
  filter,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  pluck,
  share,
  shareReplay,
  tap,
} from 'rxjs'

import { WebSocketClient } from './lib/ws'
import {
  ClientInputManager,
  GameScope,
  GameUi,
} from './ui/game'

class MessageClient {
  public readonly message$: Observable<ServerMessage>

  constructor(private readonly ws: WebSocketClient, private readonly socket: WebSocket) {
    this.message$ = this.ws.message$.pipe(
      map(e => json.parse<ServerMessage>(e.data.toString())),
      share(),
    )
  }

  public sendMessage(msg: ClientMessage): Observable<never> {
    return this.ws.send(json.stringify(msg))
  }

}

@Injectable(EntryPoint)
export class GameClient implements EntryPoint {

  private readonly clientId = `iam${Math.random()}`

  public readonly tick$: Observable<TickTiming>
  public readonly config$: Observable<ClientConfig>
  public readonly gameUi$: Observable<GameUi>
  public readonly localInput$: Observable<ClientInputState>
  public readonly localInputUpdate$: Observable<never>

  public readonly run$: Observable<never>

  constructor(
    @Inject(WebSocketClient) private readonly ws: WebSocketClient,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(ClientInputManager) public readonly localClientInput: ClientInputManager,
    @Inject(Logger) private readonly logger: Logger
  ) {
    const messageClient$ = this.ws.socket$.pipe(
      map(socket => new MessageClient(this.ws, socket)),
      shareReplay(1),
    )
    const register$ = this.ws.open$.pipe(
      tap(socket => {
        socket.send(json.stringify({ type: ClientMessageType.register, clientId: this.clientId }))
      }),
    )

    const message$ = messageClient$.pipe(
      mergeMap(client => client.message$),
      share(),
    )

    const tickUpdate$ = message$.pipe(
      filter(function(msg): msg is TickUpdateMessage {
        return msg.type === ServerMessageType.tick
      }),
      share(),
    )

    const init$ = message$.pipe(
      filter(function(msg): msg is ClientInit {
        return msg.type === ServerMessageType.clientInit
      }),
      share(),
    )
    const config$ = init$.pipe(
      pluck('config'),
      shareReplay(1),
    )
    const tick$ = tickUpdate$.pipe(
      pluck('tick'),
      // tap(tick => console.log('tick', tick)),
      share(),
    )

    const gameUi$ = GameClient.initGameUi(injector, tickUpdate$, config$)

    const localInput$ = localClientInput.input$
    const localInputUpdate$ = combineLatest([
      messageClient$,
      localInput$,
    ]).pipe(
      mergeMap(([client, inputState]: [MessageClient, ClientInputState]) => {
        const msg: ClientInputStateChange = { type: ClientMessageType.inputStateChange, inputState }
        return client.sendMessage(msg)
      })
    )

    const runUi$ = gameUi$.pipe(mergeMap(ui => ui.run$))

    this.config$ = config$
    this.tick$ = tick$
    this.localInput$ = localInput$
    this.localInputUpdate$ = localInputUpdate$
    this.gameUi$ = gameUi$

    this.run$ = merge(runUi$, register$, localInputUpdate$).pipe(silence())
  }

  public async run(): Promise<void> {
    this.run$.subscribe()
  }

  protected static initGameUi(
    injector: Injector,
    tickUpdate$: Observable<TickUpdate>,
    config$: Observable<ClientConfig>,
  ): Observable<GameUi> {
    const gameInjector = injector.createChild(GameScope, [
      tickUpdateProvider(tickUpdate$),
      tickTimingProvider(tickUpdate$.pipe(pluck('tick'))),
      clientConfigProvider(config$),
    ])

    return from(gameInjector.inject(GameUi) as Promise<GameUi>).pipe(shareReplay(1))
  }
}

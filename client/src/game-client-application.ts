import { EntryPoint, Inject, Injectable, Injector, Logger } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { TickTiming$ } from '@mp-server/shared'
import { ClientConfig$, ClientId, ClientProfile, createClientScope } from '@mp-server/shared/client'
import { Vehicle } from '@mp-server/shared/entities'
import { TickUpdate$ } from '@mp-server/shared/server'
import { from, merge, mergeMap, Observable, pluck, share, shareReplay } from 'rxjs'

import { GameClientConnection } from './game-client-connection'
import { WebSocketClient } from './lib/ws'
import { GameScope, GameUi } from './ui/game'

@Injectable(EntryPoint)
export class GameClientApplication implements EntryPoint {
  public readonly gameUi$: Observable<GameUi>
  public readonly run$: Observable<never>

  protected static initGameUi(injector: Injector): Observable<GameUi> {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const clientId: ClientId = `iam${Math.random().toFixed(6)}`
    const gameInjector = injector.createChild(GameScope)

    const clientScope = createClientScope({
      clientId,
      entityDefKey: Vehicle.key,
    })
    const clientInjector = gameInjector.createChild(clientScope, [
      {
        provide: ClientId,
        useValue: clientId,
      },
      {
        provide: ClientProfile,
        useValue: {
          entityDefKey: Vehicle.key,
        },
      },
      {
        provide: ClientConfig$,
        useFactory(conn: GameClientConnection): ClientConfig$ {
          return conn.config$
        },
        deps: [GameClientConnection],
      },
      {
        provide: TickUpdate$,
        useFactory(conn: GameClientConnection): TickUpdate$ {
          return conn.tickUpdate$
        },
        deps: [GameClientConnection],
      },
      {
        provide: TickTiming$,
        useFactory(tickUpdate$: TickUpdate$): TickTiming$ {
          return tickUpdate$.pipe(pluck('tick'), share())
        },
        deps: [TickUpdate$],
      },
    ])

    return from(clientInjector.inject(GameUi) as Promise<GameUi>).pipe(shareReplay(1))
  }

  constructor(
    @Inject(WebSocketClient) private readonly ws: WebSocketClient,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const gameUi$ = GameClientApplication.initGameUi(injector)
    const runUi$ = gameUi$.pipe(mergeMap((ui) => ui.run$))

    this.gameUi$ = gameUi$
    this.run$ = merge(runUi$).pipe(silence())
  }

  public async run(): Promise<void> {
    this.run$.subscribe()
  }
}

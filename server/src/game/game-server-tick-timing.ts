import { Inject, Injectable, Provider } from '@dandi/core'
import { HighResTimeProvider, tickTiming, TickTiming } from '@mp-server/shared'
import { Observable, of } from 'rxjs'

import { GameServerConfig } from './game-server-config'

@Injectable()
class GameServerTickTimingFactory {

  public readonly tick$: Observable<TickTiming>

  constructor(
    @Inject(GameServerConfig) protected readonly config: GameServerConfig,
    @Inject(HighResTimeProvider) protected readonly hrtime: HighResTimeProvider,
  ) {
    this.tick$ = tickTiming(of({ interval: config.tickInterval }), hrtime)
  }
}

function gameServerTickTimingFactory(factory: GameServerTickTimingFactory): Observable<TickTiming> {
  return factory.tick$
}

export const GameServerTickTiming: Provider<Observable<TickTiming>> = {
  provide: TickTiming,
  useFactory: gameServerTickTimingFactory,
  deps: [GameServerTickTimingFactory],
}

import { Provider, ScopeRestriction } from '@dandi/core'
import { combineLatest, Observable, of, switchMap, timer } from 'rxjs'
import { scan, share } from 'rxjs/operators'

import { HighResTimeProvider } from './high-res-time'
import { localToken } from './local-token'

export interface TickTimingConfig {
  interval: number
}

export interface TickTiming {
  elapsed: bigint
  tick: number
  tickInterval: number
  timestamp: bigint
}

export type TickTiming$ = Observable<TickTiming>
export const TickTiming$ = localToken.opinionated<TickTiming$>('TickTiming$', {
  multi: false,
})

export const INITIAL_TICK_TIMING: TickTiming = Object.freeze({
  tick: 0,
  timestamp: undefined,
  elapsed: 0n,
  tickInterval: undefined,
})

export function getInitialTickTiming({ interval }: TickTimingConfig, hrtime: HighResTimeProvider): TickTiming {
  return Object.assign({}, INITIAL_TICK_TIMING, {
    timestamp: hrtime(),
    tickInterval: interval,
  })
}

export function tickTiming(
  config$: Observable<TickTimingConfig>,
  hrtime: HighResTimeProvider,
): Observable<TickTiming> {
  return config$.pipe(
    switchMap((config) => combineLatest([of(config), timer(0, config.interval)])),
    scan((timing, [config, tick]): TickTiming => {
      if (!timing) {
        return getInitialTickTiming(config, hrtime)
      }
      const timestamp = hrtime()
      const elapsed = timing.elapsed + (timestamp - timing.timestamp)
      return {
        tick,
        timestamp,
        elapsed,
        tickInterval: config.interval,
      }
    }, undefined),
    share(),
  )
}

export function tickTimingProvider(
  tick$: Observable<TickTiming>,
  restrictScope?: ScopeRestriction,
): Provider<Observable<TickTiming>> {
  return {
    provide: TickTiming$,
    useValue: tick$,
    restrictScope,
  }
}

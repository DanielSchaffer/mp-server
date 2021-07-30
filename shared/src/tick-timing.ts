import { Provider, ScopeRestriction } from '@dandi/core'
import { combineLatest, Observable, of, switchMap, tap, timer } from 'rxjs'
import { scan, share } from 'rxjs/operators'

import { HighResTimeProvider } from './high-res-time'
import { localToken } from './local-token'

export interface TickTimingConfig {
  interval: number
}

export interface TickTiming {
  id: number
  timestamp: bigint
  elapsed: bigint
  interval: number
}

export const TickTiming = localToken.opinionated<Observable<TickTiming>>('TickTiming', {
  multi: false,
})

export const INITIAL_TICK_TIMING: TickTiming = Object.freeze({
  id: 0,
  timestamp: undefined,
  elapsed: 0n,
  interval: undefined,
})

export function getInitialTickTiming({ interval }: TickTimingConfig, hrtime: HighResTimeProvider): TickTiming {
  return Object.assign({}, INITIAL_TICK_TIMING, {
    timestamp: hrtime(),
    interval,
  })
}

export function tickTiming(config$: Observable<TickTimingConfig>, hrtime: HighResTimeProvider): Observable<TickTiming> {
  return config$.pipe(
    switchMap((config) => combineLatest([of(config), timer(0, config.interval)])),
    scan((tick, [config, id]) => {
      if (!tick) {
        return getInitialTickTiming(config, hrtime)
      }
      const timestamp = hrtime()
      const elapsed = tick.elapsed + (timestamp - tick.timestamp)
      return {
        id,
        timestamp,
        elapsed,
        interval: config.interval,
      }
    }, undefined),
    share(),
  )
}

export function tickTimingProvider(
  tick$: Observable<TickTiming>,
  restrictScope?: ScopeRestriction
): Provider<Observable<TickTiming>> {
  return {
    provide: TickTiming,
    useValue: tick$,
    restrictScope,
  }
}

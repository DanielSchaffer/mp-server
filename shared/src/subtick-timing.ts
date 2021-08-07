import { Provider, ScopeRestriction } from '@dandi/core'
import { map, Observable, scan, share, withLatestFrom } from 'rxjs'

import { localToken } from './local-token'
import { NO_SUBTICK_TIMING, SubtickTimingSource } from './subtick-timing-source'
import { TickTiming, TickTiming$ } from './tick-timing'

const MS_PER_SECOND = 1000

export interface SubtickTiming extends TickTiming {
  isNewTick: boolean
  /**
   * A value between 0 and ~1 representing the fraction of time between expected ticks. The value will be greater than
   * 1 if more time has elapsed since the previous tick than configured by the tick interval.
   */
  subtick: number
  subtickTimestamp: number
  subtickTimeDelta: number

  lastTickFrame?: number
  nextTickFrame?: number
}

export const SubtickTiming$ = localToken.opinionated<Observable<SubtickTiming>>('SubtickTiming$', {
  multi: false,
})

function getSubtickTiming(tick$: TickTiming$, subtickTimingSource$: SubtickTimingSource): Observable<number> {
  return subtickTimingSource$ === NO_SUBTICK_TIMING ? tick$.pipe(map(() => Date.now())) : subtickTimingSource$
}

export function subtick(tick$: TickTiming$, subtickTimingSource$: SubtickTimingSource): Observable<SubtickTiming> {
  const isNoSubtickTiming = subtickTimingSource$ === NO_SUBTICK_TIMING
  return getSubtickTiming(tick$, subtickTimingSource$).pipe(
    withLatestFrom(tick$),
    scan((result, [subtickTimestamp, { tick, tickInterval, ...timing }]): SubtickTiming => {
      const isNewTick = !result || result.tick !== tick
      const shared = {
        tick,
        tickInterval,
        isNewTick,
        subtickTimestamp,
      }

      if (!result) {
        return Object.assign(shared, {
          subtick: 0,
          lastTickFrame: subtickTimestamp,
          nextTickFrame: subtickTimestamp + tickInterval,
          elapsed: timing.elapsed,
          timestamp: timing.timestamp,
          subtickTimeDelta: 0,
        })
      }

      const subtickTimeDeltaMs = subtickTimestamp - result.subtickTimestamp
      const subtickTimeDelta = subtickTimeDeltaMs / MS_PER_SECOND

      if (result.tick === tick) {
        const { lastTickFrame, nextTickFrame } = result
        const subtick = 1 - (nextTickFrame - subtickTimestamp) / (nextTickFrame - lastTickFrame)
        const timestamp = result.timestamp + subtickTimeDeltaMs
        const elapsed = result.elapsed + subtickTimeDeltaMs
        return Object.assign(shared, {
          lastTickFrame,
          nextTickFrame,
          subtick,
          timestamp,
          elapsed,
          subtickTimeDelta,
        })
      }

      // const offBy = result.nextTickFrame - subtickTimestamp
      // const sinceLastFrame = subtickTimestamp - result.lastTickFrame
      // console.log('new tick frame', { frame, offBy, sinceLastFrame, expectedFrame: result.nextTickFrame, lastTickFrame: result.lastTickFrame })

      return Object.assign(shared, {
        subtick: isNoSubtickTiming ? 1 : 0,
        lastTickFrame: subtickTimestamp,
        nextTickFrame: subtickTimestamp + tickInterval,
        elapsed: timing.elapsed,
        timestamp: timing.timestamp,
        subtickTimeDelta,
      })
    }, undefined),
    share(),
  )
}

export function subtickTimingProvider(restrictScope?: ScopeRestriction): Provider<Observable<SubtickTiming>> {
  return {
    provide: SubtickTiming$,
    useFactory: subtick,
    deps: [TickTiming$, SubtickTimingSource],
    restrictScope,
  }
}

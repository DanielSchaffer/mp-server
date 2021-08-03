import { Provider, ScopeRestriction } from '@dandi/core'
import { Observable, scan, share, withLatestFrom } from 'rxjs'

import { localToken } from './local-token'
import { SubtickTimingSource } from './subtick-timing-source'
import { TickTiming, TickTiming$ } from './tick-timing'

export interface SubtickTiming extends TickTiming {
  isNewTick: boolean
  /**
   * A value between 0 and ~1 representing the fraction of time between expected ticks. The value will be greater than
   * 1 if more time has elapsed since the previous tick than configured by the tick interval.
   */
  subtick: number
  subtickTimestamp: number
}

export const SubtickTiming$ = localToken.opinionated<Observable<SubtickTiming>>('SubtickTiming$', {
  multi: false,
})

export function subtick(tick$: TickTiming$, subtickTimeSource$: SubtickTimingSource): Observable<SubtickTiming> {
  return subtickTimeSource$.pipe(
    withLatestFrom(tick$),
    scan((result, [subtickTimestamp, wtf]) => {
      const { tick, tickInterval } = wtf
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
        })
      }

      if (result.tick === tick) {
        const { lastTickFrame, nextTickFrame } = result
        const subtick = 1 - (nextTickFrame - subtickTimestamp) / (nextTickFrame - lastTickFrame)
        return Object.assign(shared, {
          lastTickFrame,
          nextTickFrame,
          subtick,
        })
      }

      // const offBy = result.nextTickFrame - subtickTimestamp
      // const sinceLastFrame = subtickTimestamp - result.lastTickFrame
      // console.log('new tick frame', { frame, offBy, sinceLastFrame, expectedFrame: result.nextTickFrame, lastTickFrame: result.lastTickFrame })

      return Object.assign(shared, {
        subtick: 0,
        lastTickFrame: subtickTimestamp,
        nextTickFrame: subtickTimestamp + tickInterval,
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

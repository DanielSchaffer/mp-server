import { TickTiming } from '@mp-server/shared'
import { MarbleValues } from '@rxjs-stuff/marbles'
import { expect } from 'chai'
import { scan } from 'rxjs'

import { subtick, SubtickTiming } from './subtick-timing'

describe.marbles('subtickTiming', ({ cold }) => {
  it('calculates the correct subtick', () => {
    const tick$ = cold('t-t-t-t').pipe(
      scan(
        ({ tick }): TickTiming => {
          if (tick === undefined) {
            return {
              tick: 0,
              timestamp: 0,
              elapsed: 0,
              tickInterval: 2000,
            }
          }
          tick++
          return {
            tick,
            timestamp: tick * 2000,
            elapsed: tick * 2000,
            tickInterval: 2000,
          }
        },
        { tick: undefined } as TickTiming,
      ),
    )
    const subtickTimingSource$ = cold('sssssss').pipe(scan((result) => result + 1000, -1000))
    const subtickTiming$ = subtick(tick$, subtickTimingSource$)

    const expectedSubticks: MarbleValues<SubtickTiming> = {
      a: {
        tick: 0,
        timestamp: 0,
        elapsed: 0,
        tickInterval: 2000,
        isNewTick: true,
        subtick: 0,
        subtickTimestamp: 0,
        lastTickFrame: 0,
        nextTickFrame: 2000,
        timedelta: 0,
      },
      b: {
        tick: 0,
        timestamp: 1000,
        elapsed: 1000,
        tickInterval: 2000,
        isNewTick: false,
        subtick: 0.5,
        subtickTimestamp: 1000,
        lastTickFrame: 0,
        nextTickFrame: 2000,
        timedelta: 1,
      },
      c: {
        tick: 1,
        timestamp: 2000,
        elapsed: 2000,
        tickInterval: 2000,
        isNewTick: true,
        subtick: 0,
        subtickTimestamp: 2000,
        lastTickFrame: 2000,
        nextTickFrame: 4000,
        timedelta: 1,
      },
      d: {
        tick: 1,
        timestamp: 3000,
        elapsed: 3000,
        tickInterval: 2000,
        isNewTick: false,
        subtick: 0.5,
        subtickTimestamp: 3000,
        lastTickFrame: 2000,
        nextTickFrame: 4000,
        timedelta: 1,
      },
      e: {
        tick: 2,
        timestamp: 4000,
        elapsed: 4000,
        tickInterval: 2000,
        isNewTick: true,
        subtick: 0,
        subtickTimestamp: 4000,
        lastTickFrame: 4000,
        nextTickFrame: 6000,
        timedelta: 1,
      },
      f: {
        tick: 2,
        timestamp: 5000,
        elapsed: 5000,
        tickInterval: 2000,
        isNewTick: false,
        subtick: 0.5,
        subtickTimestamp: 5000,
        lastTickFrame: 4000,
        nextTickFrame: 6000,
        timedelta: 1,
      },
      g: {
        tick: 3,
        timestamp: 6000,
        elapsed: 6000,
        tickInterval: 2000,
        isNewTick: true,
        subtick: 0,
        subtickTimestamp: 6000,
        lastTickFrame: 6000,
        nextTickFrame: 8000,
        timedelta: 1,
      },
    }

    expect(subtickTiming$).marbleValues(expectedSubticks).to.equal('abcdefg')
  })
})

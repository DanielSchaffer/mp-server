import { Provider } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'
import { TickTiming$ } from './tick-timing'

export const NO_SUBTICK_TIMING = Symbol.for(`${localToken.PKG}#NO_SUBTICK_TIMING`)

export type SubtickTimingSource = Observable<number> | typeof NO_SUBTICK_TIMING
export const SubtickTimingSource = localToken.opinionated<SubtickTimingSource>('SubtickTimingSource', {
  multi: false,
})

export function subtickTimingSourceProvider(subtickTiming$: SubtickTimingSource): Provider<SubtickTimingSource> {
  return {
    provide: SubtickTimingSource,
    useValue: subtickTiming$,
  }
}

export const NoSubtickTimingSourceProvider: Provider<SubtickTimingSource> = {
  provide: SubtickTimingSource,
  useValue: NO_SUBTICK_TIMING,
  deps: [TickTiming$],
}

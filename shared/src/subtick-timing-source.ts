import { Provider } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export type SubtickTimingSource = Observable<number>
export const SubtickTimingSource = localToken.opinionated<SubtickTimingSource>('SubtickTimingSource', {
  multi: false,
})

export function subtickTimingSourceProvider(subtickTiming$: SubtickTimingSource): Provider<SubtickTimingSource> {
  return {
    provide: SubtickTimingSource,
    useValue: subtickTiming$,
  }
}

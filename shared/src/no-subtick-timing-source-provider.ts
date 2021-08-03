import { Provider } from '@dandi/core'
import { map, Observable } from 'rxjs'
import { share } from 'rxjs/operators'

import { SubtickTimingSource } from './subtick-timing-source'
import { TickTiming, TickTiming$ } from './tick-timing'

export function noSubtickTimingSourceProviderFactory(tick$: Observable<TickTiming>): SubtickTimingSource {
  return tick$.pipe(map(() => Date.now()), share())
}

export const NoSubtickTimingSourceProvider: Provider<SubtickTimingSource> = {
  provide: SubtickTimingSource,
  useFactory: noSubtickTimingSourceProviderFactory,
  deps: [TickTiming$],
}

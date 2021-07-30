import { Provider } from '@dandi/core'
import { SubtickTimingSource } from '@mp-server/shared'
import { animationFrames, pluck, share } from 'rxjs'

function animationFramesSubtickTimingSourceFactory(): SubtickTimingSource {
  return animationFrames().pipe(
    pluck('timestamp'),
    share(),
  )
}

export const AnimationFramesSubtickTimingSourceProvider: Provider<SubtickTimingSource> = {
  provide: SubtickTimingSource,
  useFactory: animationFramesSubtickTimingSourceFactory,
}

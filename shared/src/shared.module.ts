import { ModuleBuilder, Provider, Registerable, ScopeRestriction } from '@dandi/core'
import { isProvider } from '@dandi/core/internal/util'
import { Observable } from 'rxjs'

import { HighResTimeProvider, hiresTimeProvider } from './high-res-time'
import { localToken } from './local-token'
import { subtickTimingProvider } from './subtick-timing'
import {
  NoSubtickTimingSourceProvider,
  SubtickTimingSource,
  subtickTimingSourceProvider,
} from './subtick-timing-source'
import { TickTiming, tickTimingProvider } from './tick-timing'

export interface SharedModuleConfig {
  hiresTime?: HighResTimeProvider
  subtickTimingSource?: SubtickTimingSource | false | Provider<SubtickTimingSource>
  tickTiming$?: Observable<TickTiming>
  tickTimingScope?: ScopeRestriction
}

class SharedModuleBuilder extends ModuleBuilder<SharedModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(SharedModuleBuilder, localToken.PKG, ...entries)
  }

  public config(config: SharedModuleConfig): this {
    const entries: Registerable[] = []
    if (config.hiresTime) {
      entries.push(hiresTimeProvider(config.hiresTime))
    }
    if (config.subtickTimingSource) {
      if (isProvider(config.subtickTimingSource)) {
        entries.push(config.subtickTimingSource)
      } else {
        entries.push(subtickTimingSourceProvider(config.subtickTimingSource))
      }
    } else if (config.subtickTimingSource === false) {
      entries.push(NoSubtickTimingSourceProvider)
    }
    if (config.tickTiming$) {
      entries.push(
        tickTimingProvider(config.tickTiming$, config.tickTimingScope),
        subtickTimingProvider(config.tickTimingScope),
      )
    } else if (config.tickTimingScope) {
      entries.push(subtickTimingProvider(config.tickTimingScope))
    } else if (config.subtickTimingSource === false) {
      entries.push(subtickTimingProvider())
    }
    return this.add(...entries)
  }
}

export const SharedModule = new SharedModuleBuilder()

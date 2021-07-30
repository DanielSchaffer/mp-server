import { InjectionToken } from '@dandi/core'

import { localToken } from './local-token'

export interface GameServerConfig {
  tickInterval: number
}

export const GameServerConfig: InjectionToken<GameServerConfig> = localToken.opinionated('GameServerConfig', {
  multi: false,
})

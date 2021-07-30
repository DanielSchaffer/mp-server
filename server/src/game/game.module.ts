import { ModuleBuilder, Registerable } from '@dandi/core'

import { GameServer } from './game-server'
import { GameServerConfig } from './game-server-config'
import { GameServerTickTiming } from './game-server-tick-timing'
import { HybridWebApplication } from './hybrid-web-application'
import { localToken } from './local-token'
import { ProcessHighResTime } from './process-high-res-time'

class GameModuleBuilder extends ModuleBuilder<GameModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(GameModuleBuilder, localToken.PKG, ...entries);
  }

  public config(gameServerConfig: GameServerConfig): this {
    return this.add({
      provide: GameServerConfig,
      useValue: gameServerConfig,
    })
  }
}

export const GameModule = new GameModuleBuilder(
  GameServer,
  GameServerTickTiming,
  HybridWebApplication,
  ProcessHighResTime,
)

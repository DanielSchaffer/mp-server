import { ModuleBuilder, Registerable } from '@dandi/core'
import { ControlledEntityTransformCalculation } from '@mp-server/shared/entity'

import { ClientSocketConnections$Provider } from './client-socket-connections-provider'
import { GameServer } from './game-server'
import { GameServerConfig } from './game-server-config'
import { GameServerTickTiming } from './game-server-tick-timing'
import { HybridWebApplication } from './hybrid-web-application'
import { InitialEntities$Provider } from './inititial-entities'
import { localToken } from './local-token'
import { ProcessHighResTime } from './process-high-res-time'
import { ServerActiveEntitiesMap$Provider } from './server-active-entities'
import { ServerEntityControlState$Provider } from './server-entity-control-state-provider'
import { ServerEntityStateMap$Provider } from './server-entity-state'
import { ServerUpdateEntitySpawnTriggerProvider } from './server-entity-trigger-providers'
import { ServerTickTimedEntityState$Provider } from './server-tick-timed-entity-state-provider'
import { ServerTickUpdate$Provider } from './server-tick-update-provider'

class GameModuleBuilder extends ModuleBuilder<GameModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(GameModuleBuilder, localToken.PKG, ...entries)
  }

  public config(gameServerConfig: GameServerConfig): this {
    return this.add({
      provide: GameServerConfig,
      useValue: gameServerConfig,
    })
  }
}

export const GameModule = new GameModuleBuilder(
  ClientSocketConnections$Provider,
  ControlledEntityTransformCalculation,
  GameServer,
  GameServerTickTiming,
  HybridWebApplication,
  InitialEntities$Provider,
  ProcessHighResTime,
  ServerActiveEntitiesMap$Provider,
  ServerEntityControlState$Provider,
  ServerEntityStateMap$Provider,
  ServerUpdateEntitySpawnTriggerProvider,
  ServerTickTimedEntityState$Provider,
  ServerTickUpdate$Provider,
)

import { ModuleBuilder, Registerable } from '@dandi/core'

import { EntityDefRegistry } from './entity-def-registry'
import { EntityTransformConfigProvider } from './entity-transform-config'
import { EntityTransformManager } from './entity-transform-manager'
import { localToken } from './local-token'
import { WeaponsManager } from './weapons-manager'

class EntitySharedModuleBuilder extends ModuleBuilder<EntitySharedModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(EntitySharedModuleBuilder, localToken.PKG, ...entries)
  }
}

export const EntitySharedModule = new EntitySharedModuleBuilder(
  EntityDefRegistry,
  EntityTransformConfigProvider,
  EntityTransformManager,
  WeaponsManager,
)

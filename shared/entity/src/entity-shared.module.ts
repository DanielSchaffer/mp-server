import { ModuleBuilder, Registerable } from '@dandi/core'

import { EntityTransformManager } from './entity-transform-manager'
import { localToken } from './local-token'

class EntitySharedModuleBuilder extends ModuleBuilder<EntitySharedModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(EntitySharedModuleBuilder, localToken.PKG, ...entries)
  }
}

export const EntitySharedModule = new EntitySharedModuleBuilder(
  EntityTransformManager,
)

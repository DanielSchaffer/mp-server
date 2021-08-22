import { ModuleBuilder, Provider, Registerable, ScopeRestriction } from '@dandi/core'

import { EntityDefProvider } from './entity-def-provider'
import { EntityDefRegistry } from './entity-def-registry'
import { EntityTransformConfigProvider } from './entity-transform-config'
import { EntityTransformManager } from './entity-transform-manager'
import { localToken } from './local-token'
import { spawnedEntitiesProvider } from './spawned-entities-provider'
import {
  PassthroughSpawnedEntityParentInjectorFnProvider,
  SpawnedEntityParentInjectorFn,
} from './spawned-entity-parent-injector'
import { SpawnedEntity$Provider } from './spawned-entity-provider'
import { WeaponsManager } from './weapons-manager'

class EntitySharedModuleBuilder extends ModuleBuilder<EntitySharedModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(EntitySharedModuleBuilder, localToken.PKG, ...entries)
  }
}

export interface EntitySharedModuleStatic {
  config(
    instanceScope?: ScopeRestriction,
    spawnedEntityParentInjectorProvider?: Provider<SpawnedEntityParentInjectorFn>,
  ): EntitySharedModuleBuilder
}

export const EntitySharedModule: EntitySharedModuleStatic = {
  config(
    instanceScope?: ScopeRestriction,
    spawnedEntityParentInjectorProvider: Provider<SpawnedEntityParentInjectorFn> = PassthroughSpawnedEntityParentInjectorFnProvider,
  ): EntitySharedModuleBuilder {
    return new EntitySharedModuleBuilder(
      EntityDefProvider,
      EntityDefRegistry,
      EntityTransformConfigProvider,
      EntityTransformManager,
      SpawnedEntity$Provider,
      WeaponsManager,
      spawnedEntitiesProvider(instanceScope),
      spawnedEntityParentInjectorProvider,
    )
  },
}

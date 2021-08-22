import { Injector, Provider } from '@dandi/core'

import { EntitySpawnTrigger } from './entity-spawn-trigger'
import { localToken } from './local-token'

export type SpawnedEntityParentInjectorFn = (injector: Injector, trigger: EntitySpawnTrigger) => Injector
export const SpawnedEntityParentInjectorFn = localToken.opinionated<SpawnedEntityParentInjectorFn>(
  'SpawnedEntityParentInjectorFn',
  {
    multi: false,
  },
)

export const PassthroughSpawnedEntityParentInjectorFnProvider: Provider<SpawnedEntityParentInjectorFn> = {
  provide: SpawnedEntityParentInjectorFn,
  useValue: (injector) => injector,
}

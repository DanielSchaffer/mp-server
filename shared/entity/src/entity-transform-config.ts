import { Provider } from '@dandi/core'

import { EntityScope } from './entity'
import { EntityDefRegistry } from './entity-def-registry'
import { EntityProfile } from './entity-profile'
import { localToken } from './local-token'

/**
 * 100px = 1m
 */
export interface EntityTransformConfig {
  initialVelocity: number // m/s
  maxVelocity: number // m/s
  acceleration: number // m/s/s
  deceleration: number // m/s/s
  maxRotationRate: number // º/s
  rotationAcceleration: number // º/s/s
  rotationDeceleration: number // º/s/s
}

export const EntityTransformConfig = localToken.opinionated<EntityTransformConfig>('EntityTransformConfig', {
  multi: false,
  restrictScope: EntityScope,
})

export const EntityTransformConfigProvider: Provider<EntityTransformConfig> = {
  provide: EntityTransformConfig,
  useFactory: (entityDefs: EntityDefRegistry, profile: EntityProfile): EntityTransformConfig =>
    entityDefs.get(profile.entityDefKey)?.config,
  deps: [EntityDefRegistry, EntityProfile],
}

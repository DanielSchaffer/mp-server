import { Provider } from '@dandi/core'

import { Entity, EntityScope } from './entity'
import { EntityDefRegistry } from './entity-def-registry'
import { localToken } from './local-token'

/**
 * 100px = 1m
 */
export interface EntityTransformConfig {
  initialVelocity: number
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
  useFactory: (entityDefs: EntityDefRegistry, entity: Entity): EntityTransformConfig =>
    entityDefs.get(entity.entityDefKey)?.config,
  deps: [EntityDefRegistry, Entity],
}

import { EntityDef, EntityLifetime, EntityTransformConfig } from '@mp-server/shared/entity'

/* eslint-disable @typescript-eslint/no-magic-numbers */
const STATIC_PROJECTILE_TRANSFORM_CONFIG: EntityTransformConfig = {
  initialVelocity: 1000,
  maxVelocity: 1000,
  acceleration: 1000,
  deceleration: 0,
  maxRotationRate: 0,
  rotationAcceleration: 0,
  rotationDeceleration: 0,
}

class StaticProjectileDef {
  public static readonly key = 'static-projectile'
  public static readonly config = STATIC_PROJECTILE_TRANSFORM_CONFIG
  public static readonly lifetime: EntityLifetime = {
    maxRange: 1000,
  }
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

export const StaticProjectile: EntityDef = StaticProjectileDef

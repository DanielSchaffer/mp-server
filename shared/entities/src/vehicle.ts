import { ArmedEntityDef, EntityTransformConfig } from '@mp-server/shared/entity'

import { StaticProjectile } from './static-projectile'

/* eslint-disable @typescript-eslint/no-magic-numbers */
const VEHICLE_TRANSFORM_CONFIG: EntityTransformConfig = {
  initialVelocity: 0,
  maxVelocity: 350,
  acceleration: 150,
  deceleration: 75,
  maxRotationRate: 175,
  rotationAcceleration: 25,
  rotationDeceleration: 15,
}

const DEFAULT_WEAPON_CONFIG = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  fireRate: 1000,
  entityDef: StaticProjectile,
}

const DEFAULT_ALT_WEAPON_CONFIG = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  fireRate: 2500,
  entityDef: StaticProjectile,
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
class VehicleDef {
  public static readonly key = 'vehicle'
  public static readonly config = VEHICLE_TRANSFORM_CONFIG
  public static readonly primaryWeapon = DEFAULT_WEAPON_CONFIG
  public static readonly secondaryWeapon = DEFAULT_ALT_WEAPON_CONFIG
}

export const Vehicle: ArmedEntityDef = VehicleDef

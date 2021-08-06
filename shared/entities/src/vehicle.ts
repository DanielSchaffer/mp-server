import { EntityDef, EntityTransformConfig } from '@mp-server/shared/entity'

/* eslint-disable @typescript-eslint/no-magic-numbers */
const VEHICLE_TRANSFORM_CONFIG: EntityTransformConfig = {
  initialVelocity: 0,
  maxVelocity: 150,
  acceleration: 50,
  deceleration: 75,
  maxRotationRate: 125,
  rotationAcceleration: 10,
  rotationDeceleration: 15,
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
class VehicleDef {
  public static readonly key = 'vehicle'
  public static readonly config = VEHICLE_TRANSFORM_CONFIG
}

export const Vehicle: EntityDef = VehicleDef

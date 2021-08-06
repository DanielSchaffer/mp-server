export interface EntityTransformConfig {
  pxPerM: number
  maxVelocity: number
  acceleration: number
  deceleration: number
  maxRotationRate: number
  rotationAcceleration: number
  rotationDeceleration: number
}

/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 *
 */
export const DEFAULT_TRANSFORM_CONFIG: EntityTransformConfig = {
  pxPerM: 100, // 100px = 1m
  maxVelocity: 150, // m/s
  acceleration: 50, // m/s/s
  deceleration: 75, // m/s/s
  maxRotationRate: 125, // º/s
  rotationAcceleration: 10, // º/s/s
  rotationDeceleration: 15, // º/s/s
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

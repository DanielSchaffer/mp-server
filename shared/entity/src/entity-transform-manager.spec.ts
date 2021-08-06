import { INITIAL_POINT, Point } from '@mp-server/shared'
import {
  EntityControlState,
  EntityTransformConfig,
  EntityTransformManager,
  INITIAL_ENTITY_CONTROL_STATE,
} from '@mp-server/shared/entity'
import { expect } from 'chai'

const config: EntityTransformConfig = {
  initialVelocity: 0,
  maxVelocity: 100,
  acceleration: 10,
  deceleration: 5,
  maxRotationRate: 10,
  rotationAcceleration: 10,
  rotationDeceleration: 10,
}

class EntityTransformManagerFacade extends EntityTransformManager {
  public static calculateAcceleration(
    config: EntityTransformConfig,
    prevAcceleration: Point,
    orientation: Point,
    control: EntityControlState,
  ): any {
    return super.calculateAcceleration(config, prevAcceleration, orientation, control)
  }

  public static calculateVelocityIncrement(acceleration: Point, timingMultiplier: number): Point {
    return super.calculateVelocityIncrement(acceleration, timingMultiplier)
  }
}

describe('EntityTransformManager', () => {
  describe('calculateAcceleration', () => {
    it('works', () => {
      const prevAcceleration = INITIAL_POINT
      const orientation = INITIAL_POINT
      const control: EntityControlState = Object.assign({}, INITIAL_ENTITY_CONTROL_STATE, {
        forwardAcceleration: true,
      })
      const result = EntityTransformManagerFacade.calculateAcceleration(
        config,
        prevAcceleration,
        orientation,
        control,
      )

      expect(result.y).to.equal(-config.acceleration)
    })
  })
})

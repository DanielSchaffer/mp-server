import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { Changed, ChangedContainer, Point } from '@mp-server/shared'

import { Observable } from 'rxjs'
import { scan } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState } from './entity-control-state'
import { TrackedSubtickTimedEntityState } from './entity-state'
import { EntityRotation, EntityTransform, INITIAL_ENTITY_TRANSFORM } from './entity-transform'
import { EntityTransformCalculationTrigger$, isReportedTransformTrigger } from './entity-transform-calculation-trigger'

/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * 100px = 1m
 */
export const TRANSFORM_CONFIG = {
  maxVelocity: 85, // m/s
  acceleration: 7.5, // m/s/s
  deceleration: 5, // m/s/s
  maxRotationRate: 25, // º/s
  rotationAcceleration: 10, // º/s/s
  rotationDeceleration: 15, // º/s/s
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

const ORIENTATION_Y_OFFSET_DEGRESS = 90
const DEGREES_TO_RADS_DIVISOR = 180
const WRAP_DEGREES = 360

@Injectable(RestrictScope(EntityScope))
export class EntityTransformManager {
  public readonly transform$: Observable<TrackedSubtickTimedEntityState>

  protected static calculateRotation(
    fromTransform: EntityTransform,
    control: EntityControlState,
  ): ChangedContainer<EntityRotation, Point> {
    const relativeRotation = control.rotationRight - control.rotationLeft
    // const rotationBaseAcceleration = relativeRotation > 0 ?
    //   TRANSFORM_CONFIG.rotationAcceleration :
    //   TRANSFORM_CONFIG.rotationDeceleration
    // const rotationAcceleration = rotationBaseAcceleration * relativeRotation
    // const rotationRate = fromTransform.rotation.rate.y + (TRANSFORM_CONFIG.maxRotationRate * timingMultiplier)
    const rotationRate = relativeRotation * TRANSFORM_CONFIG.maxRotationRate
    // const finalRotationRate = rotationRate > TRANSFORM_CONFIG.maxRotationRate ? TRANSFORM_CONFIG.maxRotationRate : rotationRate
    return {
      // acceleration: { x: 0, y: rotationAcceleration, z: 0 },
      acceleration: {
        x: 0,
        y: 0,
        z: 0,
        changed: false,
      },
      rate: Point.isChanged(fromTransform.rotation.rate, {
        x: 0,
        y: rotationRate,
        z: 0,
      }),
    }
  }

  protected static calculateAcceleration(
    prevAcceleration: Point,
    orientation: Point,
    control: EntityControlState,
  ): Changed<Point> {
    const relativeAcceleration = control.backwardAcceleration - control.forwardAcceleration
    const baseAcceleration =
      relativeAcceleration < 0 ? TRANSFORM_CONFIG.acceleration : TRANSFORM_CONFIG.deceleration
    const accelerationRate = baseAcceleration * relativeAcceleration
    const angleRads = (orientation.y + ORIENTATION_Y_OFFSET_DEGRESS) * (Math.PI / DEGREES_TO_RADS_DIVISOR)
    return Point.isChanged(prevAcceleration, {
      x: Math.cos(angleRads) * accelerationRate,
      y: Math.sin(angleRads) * accelerationRate,
      z: 0,
    })
  }

  protected static calculateOrientation(
    fromTransform: EntityTransform,
    rotation: EntityRotation,
    timingMultiplier: number,
  ): Changed<Point> {
    return Point.wrap(
      Point.add(fromTransform.position.orientation, Point.multiply(rotation.rate, timingMultiplier)),
      WRAP_DEGREES,
    )
  }

  protected static initTransform(
    transformTrigger$: EntityTransformCalculationTrigger$,
  ): Observable<TrackedSubtickTimedEntityState> {
    return transformTrigger$.pipe(
      scan((previous: TrackedSubtickTimedEntityState, trigger): TrackedSubtickTimedEntityState => {
        const { timing, control } = trigger
        const lastTickTransform =
          (isReportedTransformTrigger(trigger) ? trigger.lastTickTransform : previous?.lastTickTransform) ??
          INITIAL_ENTITY_TRANSFORM
        if (!previous) {
          previous = Object.assign(
            {
              control,
              timing,
              transform: INITIAL_ENTITY_TRANSFORM,
              lastTickTransform,
            },
            lastTickTransform ?? INITIAL_ENTITY_TRANSFORM,
          )
        }
        const fromTransform = timing.isNewTick ? previous.transform : lastTickTransform
        const timingMultiplier = timing.subtick

        const rotation = this.calculateRotation(fromTransform, control)
        const orientation = this.calculateOrientation(fromTransform, rotation, timingMultiplier)
        const acceleration = this.calculateAcceleration(
          previous.transform.movement.acceleration,
          orientation,
          control,
        )

        const velocityIncrement = Point.multiply(acceleration, timingMultiplier)
        const velocity = Point.add(
          fromTransform.movement.velocity,
          velocityIncrement,
          TRANSFORM_CONFIG.maxVelocity,
        )
        const locationIncrement = Point.multiply(velocity, timingMultiplier)
        const location = Point.add(fromTransform.position.location, locationIncrement)

        const movement = {
          acceleration,
          velocity,
        }

        const position = {
          orientation,
          location,
        }

        const transform = {
          rotation,
          position,
          movement,
        }
        return {
          control,
          timing,
          transform,
          lastTickTransform: fromTransform,
        }
      }, undefined),
    )
  }

  constructor(
    @Inject(EntityTransformCalculationTrigger$) public transformTrigger$: EntityTransformCalculationTrigger$,
  ) {
    this.transform$ = EntityTransformManager.initTransform(transformTrigger$)
  }
}

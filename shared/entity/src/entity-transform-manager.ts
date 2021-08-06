import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { Changed, ChangedContainer, Point } from '@mp-server/shared'

import { Observable } from 'rxjs'
import { scan } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState } from './entity-control-state'
import { TrackedSubtickTimedEntityState } from './entity-state'
import { EntityRotation, EntityTransform, INITIAL_ENTITY_TRANSFORM } from './entity-transform'
import {
  EntityTransformCalculationTrigger$,
  isReportedTransformTrigger,
} from './entity-transform-calculation-trigger'
import { DEFAULT_TRANSFORM_CONFIG, EntityTransformConfig } from './entity-transform-config'

const ORIENTATION_Y_OFFSET_DEGREES = 90
const DEGREES_TO_RADS_DIVISOR = 180
const WRAP_DEGREES = 360

@Injectable(RestrictScope(EntityScope))
export class EntityTransformManager {
  public readonly transform$: Observable<TrackedSubtickTimedEntityState>

  protected static calculateRotation(
    config: EntityTransformConfig,
    fromTransform: EntityTransform,
    control: EntityControlState,
  ): ChangedContainer<EntityRotation, Point> {
    const relativeRotation = control.rotationRight - control.rotationLeft
    // const rotationBaseAcceleration = relativeRotation > 0 ?
    //   TRANSFORM_CONFIG.rotationAcceleration :
    //   TRANSFORM_CONFIG.rotationDeceleration
    // const rotationAcceleration = rotationBaseAcceleration * relativeRotation
    // const rotationRate = fromTransform.rotation.rate.y + (TRANSFORM_CONFIG.maxRotationRate * timingMultiplier)
    const rotationRate = relativeRotation * config.maxRotationRate
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
    config: EntityTransformConfig,
    prevAcceleration: Point,
    orientation: Point,
    control: EntityControlState,
  ): Changed<Point> {
    const relativeAcceleration = control.backwardAcceleration - control.forwardAcceleration
    const baseAcceleration = relativeAcceleration < 0 ? config.acceleration : config.deceleration
    const accelerationRate = baseAcceleration * relativeAcceleration
    const angleRads = (orientation.y + ORIENTATION_Y_OFFSET_DEGREES) * (Math.PI / DEGREES_TO_RADS_DIVISOR)
    return Point.isChanged(prevAcceleration, {
      x: Math.cos(angleRads) * accelerationRate,
      y: Math.sin(angleRads) * accelerationRate,
      z: 0,
    })
  }

  protected static calculateVelocityIncrement(acceleration: Point, timedelta: number): Point {
    // Δv = aav * Δt
    return Point.multiply(acceleration, timedelta)
  }

  protected static calculateOrientation(
    config: EntityTransformConfig,
    fromTransform: EntityTransform,
    rotation: EntityRotation,
    timedelta: number,
  ): Changed<Point> {
    return Point.wrap(
      Point.add(fromTransform.position.orientation, Point.multiply(rotation.rate, timedelta)),
      WRAP_DEGREES,
    )
  }

  protected static initTransform(
    config: EntityTransformConfig,
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
        if (timing.isNewTick) {
          if (Point.hasDiff(lastTickTransform.position.location, previous.transform.position.location)) {
            // debugger
          }
        }

        const fromTransform = timing.isNewTick ? lastTickTransform : previous.transform

        const rotation = this.calculateRotation(config, fromTransform, control)
        const orientation = this.calculateOrientation(config, fromTransform, rotation, timing.timedelta)
        const acceleration = this.calculateAcceleration(
          config,
          previous.transform.movement.acceleration,
          orientation,
          control,
        )

        const velocityIncrement = this.calculateVelocityIncrement(acceleration, timing.timedelta)
        const velocity = Point.add(fromTransform.movement.velocity, velocityIncrement, config.maxVelocity)
        const locationIncrement = Point.multiply(velocity, timing.timedelta)
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
    this.transform$ = EntityTransformManager.initTransform(DEFAULT_TRANSFORM_CONFIG, transformTrigger$)
  }
}

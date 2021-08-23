import { Inject, Injectable, Logger, RestrictScope } from '@dandi/core'
import { Changed, ChangedContainer, Point } from '@mp-server/shared'

import { Observable } from 'rxjs'
import { scan } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState } from './entity-control-state'
import { EntitySpawnTrigger } from './entity-spawn-trigger'
import { SubtickTimedEntityState } from './entity-state'
import { EntityRotation, EntityTransform, INITIAL_ENTITY_TRANSFORM } from './entity-transform'
import {
  EntityTransformCalculationTrigger$,
  isReportedTransformTrigger,
} from './entity-transform-calculation-trigger'
import { EntityTransformConfig } from './entity-transform-config'

const ORIENTATION_Y_OFFSET_DEGREES = 90
const DEGREES_TO_RADS_DIVISOR = 180
const WRAP_DEGREES = 360

@Injectable(RestrictScope(EntityScope))
export class EntityTransformManager {
  public readonly transform$: Observable<SubtickTimedEntityState>

  public static calculateAcceleration(
    transformConfig: EntityTransformConfig,
    prevAcceleration: Point,
    orientation: Point,
    relativeAcceleration: number,
  ): Changed<Point> {
    const baseAcceleration = relativeAcceleration > 0 ? transformConfig.deceleration : transformConfig.acceleration
    const accelerationRate = baseAcceleration * relativeAcceleration
    const angleRads = (orientation.y + ORIENTATION_Y_OFFSET_DEGREES) * (Math.PI / DEGREES_TO_RADS_DIVISOR)
    return Point.isChanged(prevAcceleration, {
      x: Math.cos(angleRads) * accelerationRate,
      y: Math.sin(angleRads) * accelerationRate,
      z: 0,
    })
  }

  protected static calculateRotation(
    transformConfig: EntityTransformConfig,
    fromTransform: EntityTransform,
    control: EntityControlState,
  ): ChangedContainer<EntityRotation, Point> {
    const relativeRotation = control.rotationRight - control.rotationLeft
    // const rotationBaseAcceleration = relativeRotation > 0 ?
    //   TRANSFORM_CONFIG.rotationAcceleration :
    //   TRANSFORM_CONFIG.rotationDeceleration
    // const rotationAcceleration = rotationBaseAcceleration * relativeRotation
    // const rotationRate = fromTransform.rotation.rate.y + (TRANSFORM_CONFIG.maxRotationRate * timingMultiplier)
    const rotationRate = relativeRotation * transformConfig.maxRotationRate
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

  protected static calculateControlledAcceleration(
    transformConfig: EntityTransformConfig,
    prevAcceleration: Point,
    orientation: Point,
    control: EntityControlState,
  ): Changed<Point> {
    const relativeAcceleration = control.backwardAcceleration - control.forwardAcceleration
    return this.calculateAcceleration(transformConfig, prevAcceleration, orientation, relativeAcceleration)
  }

  protected static calculateVelocityIncrement(acceleration: Point, timedelta: number): Point {
    // Δv = aav * Δt
    return Point.multiply(acceleration, timedelta)
  }

  protected static calculateOrientation(
    transformConfig: EntityTransformConfig,
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
    transformConfig: EntityTransformConfig,
    spawnTrigger: EntitySpawnTrigger,
    transformTrigger$: EntityTransformCalculationTrigger$,
    logger: Logger,
  ): Observable<SubtickTimedEntityState> {
    return transformTrigger$.pipe(
      scan((previous: SubtickTimedEntityState, trigger): SubtickTimedEntityState => {
        const { timing, control } = trigger

        if (!previous) {
          previous = {
            control,
            timing,
            transform:
              (spawnTrigger.initialTransform as ChangedContainer<EntityTransform, Point>) ??
              INITIAL_ENTITY_TRANSFORM,
          }
        }

        if (isReportedTransformTrigger(trigger) && timing.isNewTick) {
          // const diff = Point.diff(previous.transform.position.location, trigger.report.transform.position.location)
          // if (Point.absTotal(diff) > 1) {
          //   logger.warn('out of sync', diff)
          // }

          Object.assign(previous, {
            transform: trigger.report.transform,
          })
        }

        // const lastReportedState: EntityStateReport = (isReportedTransformTrigger(trigger)
        //   ? trigger.report
        //   : previous) ?? {
        //   timing,
        //   transform: INITIAL_ENTITY_TRANSFORM,
        // }

        // if (
        //   isReportedTransformTrigger(trigger) &&
        //   previous &&
        //   !timing.subtick &&
        //   timing.tick - previous.timing.tick !== 1
        // ) {
        //   logger.warn(`timing diff is ${timing.tick - trigger.report.timing.tick}`, {
        //     'timing.tick': timing.tick,
        //     'trigger.report.timing.tick': trigger.report.timing,
        //   })
        // }

        // const fromState: EntityStateReport = timing.isNewTick ? lastReportedState : previous
        // const fromState: EntityStateReport = timing.isNewTick ? lastReportedState : previous
        // const timedelta = timing.isNewTick

        // const fromTransform = previous.transform
        // const fromTransform = previousTickState.transform

        const rotation = this.calculateRotation(transformConfig, previous.transform, control)
        const orientation = this.calculateOrientation(
          transformConfig,
          previous.transform,
          rotation,
          timing.subtickTimeDelta,
        )
        const acceleration = this.calculateControlledAcceleration(
          transformConfig,
          previous.transform.movement.acceleration,
          orientation,
          control,
        )

        const velocityIncrement = this.calculateVelocityIncrement(acceleration, timing.subtickTimeDelta)
        const velocity = Point.add(
          previous.transform.movement.velocity,
          velocityIncrement,
          transformConfig.maxVelocity,
        )
        const locationIncrement = Point.multiply(velocity, timing.subtickTimeDelta)
        const location = Point.add(previous.transform.position.location, locationIncrement)

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
        }
      }, undefined),
    )
  }

  constructor(
    @Inject(EntityTransformCalculationTrigger$)
    protected readonly transformTrigger$: EntityTransformCalculationTrigger$,
    @Inject(EntityTransformConfig) protected readonly transformConfig: EntityTransformConfig,
    @Inject(EntitySpawnTrigger) protected readonly spawnTrigger: EntitySpawnTrigger,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    this.transform$ = EntityTransformManager.initTransform(
      transformConfig,
      spawnTrigger,
      transformTrigger$,
      logger,
    )
  }
}

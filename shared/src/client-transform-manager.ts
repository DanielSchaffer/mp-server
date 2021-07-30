import { Inject, Injectable, RestrictScope } from '@dandi/core'
import {
  Changed, ChangedContainer,
  ClientInputState,
  ClientRotation,
  ClientTransform,
  INITIAL_CLIENT_TRANSFORM,
  Point,
  TimedClientTransform,
} from '@mp-server/shared'
import { Observable, withLatestFrom } from 'rxjs'
import { scan } from 'rxjs/operators'

import { ClientScope } from './client-scope'
import { SubtickTiming } from './subtick-timing'

/**
 * 100px = 1m
 */
export const TRANSFORM_CONFIG = {
  maxVelocity: 85,          // m/s
  acceleration: 7.5,        // m/s/s
  deceleration: 5,          // m/s/s
  maxRotationRate: 25,      // º/s
  rotationAcceleration: 10, // º/s/s
  rotationDeceleration: 15, // º/s/s
}

@Injectable(RestrictScope(ClientScope))
export class ClientTransformManager {

  public readonly transform$: Observable<ChangedContainer<ClientTransform, Point>>

  constructor(
    @Inject(SubtickTiming) protected readonly tick$: Observable<SubtickTiming>,
    @Inject(ClientInputState) protected readonly clientInput$: Observable<ClientInputState>,
  ) {
    this.transform$ = ClientTransformManager.initTransform(tick$, clientInput$)
  }

  protected static calculateRotation(
    fromTransform: ClientTransform,
    input: ClientInputState,
  ): ChangedContainer<ClientRotation, Point> {
    const relativeRotation = input.rotationRight - input.rotationLeft
    // const rotationBaseAcceleration = relativeRotation > 0 ?
    //   TRANSFORM_CONFIG.rotationAcceleration :
    //   TRANSFORM_CONFIG.rotationDeceleration
    // const rotationAcceleration = rotationBaseAcceleration * relativeRotation
    // const rotationRate = fromTransform.rotation.rate.y + (TRANSFORM_CONFIG.maxRotationRate * timingMultiplier)
    const rotationRate = relativeRotation * TRANSFORM_CONFIG.maxRotationRate
    // const finalRotationRate = rotationRate > TRANSFORM_CONFIG.maxRotationRate ? TRANSFORM_CONFIG.maxRotationRate : rotationRate
    return {
      // acceleration: { x: 0, y: rotationAcceleration, z: 0 },
      acceleration: { x: 0, y: 0, z: 0, changed: false },
      rate: Point.isChanged(fromTransform.rotation.rate, { x: 0, y: rotationRate, z: 0 }),
    }
  }

  protected static calculateAcceleration(prevAcceleration: Point, orientation: Point, input: ClientInputState): Changed<Point> {
    const relativeAcceleration = input.backwardAcceleration - input.forwardAcceleration
    const baseAcceleration = relativeAcceleration < 0 ? TRANSFORM_CONFIG.acceleration : TRANSFORM_CONFIG.deceleration
    const accelerationRate = baseAcceleration * relativeAcceleration
    const angleRads = (orientation.y + 90) * (Math.PI / 180)
    return Point.isChanged(prevAcceleration, {
      x: Math.cos(angleRads) * accelerationRate,
      y: Math.sin(angleRads) * accelerationRate,
      z: 0,
    })
  }

  protected static initTransform(
    subtick$: Observable<SubtickTiming>,
    input$: Observable<ClientInputState>,
  ): Observable<TimedClientTransform> {
    return subtick$.pipe(
      withLatestFrom(input$),
      scan((previous: TimedClientTransform, [timing, input]): TimedClientTransform => {
        if (!previous) {
          previous = Object.assign({ timing, lastTickTransform: INITIAL_CLIENT_TRANSFORM }, INITIAL_CLIENT_TRANSFORM)
        }
        const fromTransform = timing.isNewTick ? previous : previous.lastTickTransform
        const timingMultiplier = timing.subtick

        const rotation = this.calculateRotation(fromTransform, input)
        const orientation = Point.add(fromTransform.position.orientation, Point.multiply(rotation.rate, timingMultiplier))
        const acceleration = this.calculateAcceleration(previous.movement.acceleration, orientation, input)

        const velocityIncrement = Point.multiply(acceleration, timingMultiplier)
        const velocity = Point.add(fromTransform.movement.velocity, velocityIncrement, TRANSFORM_CONFIG.maxVelocity)
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
        return { timing, rotation, position, movement, lastTickTransform: fromTransform }
      }, undefined)
    )
  }
}

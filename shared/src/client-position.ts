import { INITIAL_POINT, Point } from './point'
import { SubtickTiming } from './subtick-timing'
import { ChangedContainer } from './changed'

export interface ClientPosition {
  readonly location: Point
  readonly orientation: Point
}

export const INITIAL_CLIENT_POSITION = Object.freeze({
  location: INITIAL_POINT,
  orientation: INITIAL_POINT,
})

export interface ClientMovement {
  readonly velocity: Point
  readonly acceleration: Point
}

export const INITIAL_CLIENT_MOVEMENT: ChangedContainer<ClientMovement, Point> = Object.freeze({
  velocity: INITIAL_POINT,
  acceleration: INITIAL_POINT,
})

export interface ClientRotation {
  readonly rate: Point
  readonly acceleration: Point
}

export const INITIAL_CLIENT_ROTATION: ChangedContainer<ClientRotation, Point> = Object.freeze({
  rate: INITIAL_POINT,
  acceleration: INITIAL_POINT,
})

export interface ClientTransform {
  position: ClientPosition
  movement: ClientMovement
  rotation: ClientRotation
}

export const INITIAL_CLIENT_TRANSFORM: ChangedContainer<ClientTransform, Point> = Object.freeze({
  position: INITIAL_CLIENT_POSITION,
  movement: INITIAL_CLIENT_MOVEMENT,
  rotation: INITIAL_CLIENT_ROTATION,
})

export interface TimedClientTransform extends ChangedContainer<ClientTransform, Point> {
  lastTickTransform: ClientTransform
  timing: SubtickTiming
}

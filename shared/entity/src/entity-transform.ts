import { ChangedContainer, INITIAL_POINT, Point } from '@mp-server/shared'

export interface EntityPosition {
  readonly location: Point
  readonly orientation: Point
}

export const INITIAL_ENTITY_POSITION = Object.freeze({
  location: INITIAL_POINT,
  orientation: INITIAL_POINT,
})

export interface EntityMovement {
  readonly velocity: Point
  readonly acceleration: Point
}

export const INITIAL_ENTITY_MOVEMENT: ChangedContainer<EntityMovement, Point> = Object.freeze({
  velocity: INITIAL_POINT,
  acceleration: INITIAL_POINT,
})

export interface EntityRotation {
  readonly rate: Point
  readonly acceleration: Point
}

export const INITIAL_ENTITY_ROTATION: ChangedContainer<EntityRotation, Point> = Object.freeze({
  rate: INITIAL_POINT,
  acceleration: INITIAL_POINT,
})

export interface EntityTransform {
  position: EntityPosition
  movement: EntityMovement
  rotation: EntityRotation
}

export interface EntityTransformStatic {
  hasChanges(a: EntityTransform, b: EntityTransform): boolean
}

export const EntityTransform: EntityTransformStatic = {
  hasChanges(a: EntityTransform, b: EntityTransform): boolean {
    return (
      Point.hasDiff(a.position.location, b.position.location) ||
      Point.hasDiff(a.position.orientation, b.position.orientation) ||
      Point.hasDiff(a.movement.acceleration, b.movement.velocity) ||
      Point.hasDiff(a.movement.velocity, b.movement.velocity) ||
      Point.hasDiff(a.rotation.acceleration, b.rotation.rate) ||
      Point.hasDiff(a.rotation.rate, b.rotation.rate)
    )
  },
}

export const INITIAL_ENTITY_TRANSFORM: ChangedContainer<EntityTransform, Point> = Object.freeze({
  position: INITIAL_ENTITY_POSITION,
  movement: INITIAL_ENTITY_MOVEMENT,
  rotation: INITIAL_ENTITY_ROTATION,
})

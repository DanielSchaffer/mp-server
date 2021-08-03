import { Observable } from 'rxjs'

import { EntityScope } from './entity'
import { localToken } from './local-token'

export interface EntityControlState {
  forwardAcceleration: number
  backwardAcceleration: number
  rotationLeft: number
  rotationRight: number
  fire: boolean
  altFire: boolean
}

export type InitialEntityControlState = {
  [TKey in keyof EntityControlState]: EntityControlState[TKey] extends number ? 0 : false
}

export const INITIAL_ENTITY_CONTROL_STATE: InitialEntityControlState = {
  forwardAcceleration: 0,
  backwardAcceleration: 0,
  rotationLeft: 0,
  rotationRight: 0,
  fire: false,
  altFire: false,
}

export type EntityControlState$ = Observable<EntityControlState>
export const EntityControlState$ = localToken.opinionated<EntityControlState$>('EntityControlState$', {
  multi: false,
  restrictScope: EntityScope,
})

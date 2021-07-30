import { Observable } from 'rxjs'

import { ClientScope } from './client-scope'
import { localToken } from './local-token'

export interface ClientInputState {
  forwardAcceleration: number
  backwardAcceleration: number
  rotationLeft: number
  rotationRight: number
  fire: boolean
  altFire: boolean
}

export type InitialClientInputState = {
  [TKey in keyof ClientInputState]: ClientInputState[TKey] extends number ? 0 : false
}

export const INITIAL_CLIENT_INPUT_STATE: InitialClientInputState = {
  forwardAcceleration: 0,
  backwardAcceleration: 0,
  rotationLeft: 0,
  rotationRight: 0,
  fire: false,
  altFire: false,
}

export const ClientInputState = localToken.opinionated<Observable<ClientInputState>>('ClientInputState', {
  multi: false,
  restrictScope: ClientScope
})

import { EntityControlState } from '@mp-server/shared/entity'

import { ClientId, ClientProfile } from './client'
import { ClientMessageType } from './client-message-type'

export interface ClientRegistration {
  type: ClientMessageType.register
  clientId: ClientId
  profile: ClientProfile
}

export interface ClientControlStateChange {
  type: ClientMessageType.inputStateChange
  controlState: EntityControlState
}

export interface ClientDisconnect {
  type: ClientMessageType.disconnect
}

export type ClientMessage = ClientDisconnect | ClientControlStateChange | ClientRegistration

export function isClientRegistration(msg: ClientMessage): msg is ClientRegistration {
  return msg.type === ClientMessageType.register
}

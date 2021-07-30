import { ClientId } from './client'
import { ClientInputState } from './client-input-state'
import { ClientMessageType } from './client-message-type'

export interface ClientRegistration {
  type: ClientMessageType.register
  clientId: ClientId
}

export interface ClientInputStateChange {
  type: ClientMessageType.inputStateChange
  inputState: ClientInputState
}

export interface ClientDisconnect {
  type: ClientMessageType.disconnect
}

export type ClientMessage = ClientDisconnect | ClientInputStateChange | ClientRegistration

export function isClientRegistration(msg: ClientMessage): msg is ClientRegistration {
  return msg.type === ClientMessageType.register
}

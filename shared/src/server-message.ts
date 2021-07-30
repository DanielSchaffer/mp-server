import { ClientId } from './client'
import { ClientConfig } from './client-config'
import { ClientInputState } from './client-input-state'
import { ServerMessageType } from './server-message-type'
import { TickUpdate } from './tick-update'

export interface ClientInputStateMap {
  [clientId: string]: ClientInputState
}

export interface ClientMessageUpdate {
  addedClient: ClientId
  removedClient: ClientId
  inputStates: ClientInputStateMap
}

export interface ClientInit {
  type: ServerMessageType.clientInit
  config: ClientConfig
}

export interface TickUpdateMessage extends TickUpdate {
  type: ServerMessageType.tick,
}

export type ServerMessage = ClientInit | TickUpdateMessage

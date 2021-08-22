import { TickTiming } from '@mp-server/shared'
import { ClientConfig } from '@mp-server/shared/client'
import { EntityId, EntitySpawnData } from '@mp-server/shared/entity'

import { ServerMessageType } from './server-message-type'
import { TickUpdate } from './tick-update'

export interface ClientInit {
  type: ServerMessageType.clientInit
  config: ClientConfig
}

export interface TickUpdateMessage extends TickUpdate {
  type: ServerMessageType.tick
}

export interface AddEntityMessage extends EntitySpawnData {
  type: ServerMessageType.addEntity
  tick: TickTiming
}

export interface RemoveEntityMessage {
  type: ServerMessageType.removeEntity
  tick: TickTiming
  entityId: EntityId
}

export type EntityMessage = AddEntityMessage | RemoveEntityMessage

export type ServerMessage = ClientInit | TickUpdateMessage | EntityMessage

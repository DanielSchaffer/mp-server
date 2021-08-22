import { ChangedContainer, Point } from '@mp-server/shared'

import { Entity } from './entity'
import { EntityState } from './entity-state'
import { EntityTransform } from './entity-transform'
import { FireWeaponEvent } from './spawned-entity'

export enum EntityEventType {
  spawn = 'spawn',
  despawn = 'despawn',
  firedWeapon = 'firedWeapon',
  stateUpdate = 'stateUpdate',
}

export interface BaseEntityEvent {
  entity: Entity
}

export interface EntitySpawnEvent extends BaseEntityEvent {
  type: EntityEventType.spawn
  initialTransform?: ChangedContainer<EntityTransform, Point>
}

export interface EntityDespawnEvent extends BaseEntityEvent {
  type: EntityEventType.despawn
}

export interface EntityStateUpdateEvent extends BaseEntityEvent {
  type: EntityEventType.stateUpdate
  state: EntityState
}

export interface EntityFireWeaponEvent extends BaseEntityEvent, FireWeaponEvent {
  type: EntityEventType.firedWeapon
}

export type EntityEvent = EntityDespawnEvent | EntityFireWeaponEvent | EntitySpawnEvent | EntityStateUpdateEvent

export function entityEvent<
  TEvent extends EntityEvent,
  TType extends TEvent['type'],
  TData extends Omit<TEvent, 'type'>,
>(type: TType, data: TData): { type: TType } & TData {
  return { type, ...data }
}

export function entityEventFactory<
  TEvent extends EntityEvent,
  TType extends TEvent['type'],
  TData extends Omit<TEvent, 'type'>,
>(type: TType): (data: TData) => { type: TType } & TData {
  return (data: TData) => entityEvent(type, data)
}

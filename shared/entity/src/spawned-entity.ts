import { Injector } from '@dandi/core'
import { ChangedContainer, Point } from '@mp-server/shared'
import { Observable } from 'rxjs'

import { Entity, EntityScope } from './entity'
import { EntityDef } from './entity-def'
import { EntityEvent } from './entity-event'
import { TickTimedEntityState$ } from './entity-state'
import { EntityTransform } from './entity-transform'
import { localToken } from './local-token'

export interface FireWeaponEvent {
  projectileDef: EntityDef
  sourceTransform: ChangedContainer<EntityTransform, Point>
}

export interface SpawnedEntity extends Entity {
  readonly def: EntityDef
  readonly injector: Injector
  readonly initialTransform: EntityTransform

  readonly despawn$: Observable<this>
  readonly event$: Observable<EntityEvent>
  readonly fireWeapon$: Observable<FireWeaponEvent>
  readonly state$: TickTimedEntityState$
}

export type SpawnedEntity$ = Observable<SpawnedEntity>
export const SpawnedEntity$ = localToken.opinionated<SpawnedEntity$>('SpawnedEntity$', {
  multi: false,
  restrictScope: EntityScope,
})

export type SpawnedEntities$ = Observable<SpawnedEntity>
export const SpawnedEntities$ = localToken.opinionated<SpawnedEntities$>('SpawnedEntities$', {
  multi: false,
})

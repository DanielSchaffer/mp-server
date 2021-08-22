import { Injector } from '@dandi/core'
import { createObject, Descriptor, DescriptorMap } from '@mp-server/common'
import {
  map,
  mapTo,
  merge,
  NEVER,
  Observable,
  race,
  shareReplay,
  startWith,
  switchMapTo,
  takeUntil,
  timer,
  withLatestFrom,
} from 'rxjs'
import { share } from 'rxjs/operators'

import { Entity } from './entity'
import { EntityDef } from './entity-def'
import { EntityDespawnTrigger$ } from './entity-despawn-trigger'
import {
  EntityDespawnEvent,
  EntityEvent,
  entityEvent,
  entityEventFactory,
  EntityEventType,
  EntityFireWeaponEvent,
  EntitySpawnEvent,
  EntityStateUpdateEvent,
} from './entity-event'
import { TickTimedEntityState$ } from './entity-state'
import { FireWeaponEvent, SpawnedEntity, SpawnedEntity$ } from './spawned-entity'
import { WeaponsManager } from './weapons-manager'

function readonlyProperty<T>(value: T): Descriptor<T> {
  return {
    value,
    writable: false,
  }
}

function spawnedEntityFactory(
  injector: Injector,
  entity: Entity,
  def: EntityDef,
  state$: TickTimedEntityState$,
  despawnTriggers: EntityDespawnTrigger$[],
  weapons: WeaponsManager,
): SpawnedEntity$ {
  const despawnTrigger$ = race(...despawnTriggers).pipe(shareReplay(1))
  const spawnEvent$: Observable<EntitySpawnEvent> = NEVER.pipe(
    startWith(undefined),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    map(() => entityEvent(EntityEventType.spawn, { entity: spawnedEntity })),
    shareReplay(1),
  )
  const despawnEvent$: Observable<EntityDespawnEvent> = despawnTrigger$.pipe(
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    map(() => ({ entity: spawnedEntity })),
    map(entityEventFactory(EntityEventType.despawn)),
    shareReplay(1),
  )
  // use closeEvent$ to emit after despawnEvent$ emits so that the events$ observable can emit the despawn event
  // and then complete immediately after
  const closeEvent$: Observable<void> = despawnEvent$.pipe(switchMapTo(timer(0)), mapTo(undefined), shareReplay(1))
  const stateUpdateEvent$: Observable<EntityStateUpdateEvent> = state$.pipe(
    map((state) => ({
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      entity: spawnedEntity,
      state,
    })),
    map(entityEventFactory(EntityEventType.stateUpdate)),
    share(),
  )
  const fireWeapon$: Observable<FireWeaponEvent> = weapons.fire$.pipe(
    withLatestFrom(state$),
    map(([projectileDef, state]) => ({
      projectileDef,
      sourceTransform: state.transform,
    })),
    share(),
  )
  const fireWeaponEvent$: Observable<EntityFireWeaponEvent> = fireWeapon$.pipe(
    map((event) => ({
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      entity: spawnedEntity,
      ...event,
    })),
    map(entityEventFactory(EntityEventType.firedWeapon)),
    share(),
  )
  const event$: Observable<EntityEvent> = merge(
    spawnEvent$,
    despawnEvent$,
    fireWeaponEvent$,
    stateUpdateEvent$,
  ).pipe(takeUntil(closeEvent$))
  const props: DescriptorMap<Entity, SpawnedEntity> = {
    def: readonlyProperty(def),
    injector: readonlyProperty(injector),
    despawn$: {
      get(this: SpawnedEntity): Observable<SpawnedEntity> {
        return despawnTrigger$.pipe(mapTo(this))
      },
    },
    event$: readonlyProperty(event$),
    fireWeapon$: readonlyProperty(fireWeapon$),
    state$: {
      value: state$,
      writable: false,
    },
  }
  const spawnedEntity: SpawnedEntity = createObject(entity, props)
  return NEVER.pipe(
    startWith(spawnedEntity),
    takeUntil(despawnTrigger$),
    // finalize(() => Disposable.dispose(injector, 'entity despawn')),
    shareReplay(1),
  )
}

export const SpawnedEntity$Provider = {
  provide: SpawnedEntity$,
  useFactory: spawnedEntityFactory,
  deps: [Injector, Entity, EntityDef, TickTimedEntityState$, EntityDespawnTrigger$, WeaponsManager],
}

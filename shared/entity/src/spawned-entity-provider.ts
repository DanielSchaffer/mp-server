import { Injector } from '@dandi/core'
import { createObject, Descriptor, DescriptorMap } from '@mp-server/common'
import {
  distinctUntilChanged,
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
import { EntitySpawnTrigger } from './entity-spawn-trigger'
import { TickTimedEntityState$ } from './entity-state'
import { EntityTransform } from './entity-transform'
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
  spawnTrigger: EntitySpawnTrigger,
  entity: Entity,
  def: EntityDef,
  state$: TickTimedEntityState$,
  despawnTriggers: EntityDespawnTrigger$[],
  weapons: WeaponsManager,
): SpawnedEntity$ {
  const despawnTrigger$ = race(...despawnTriggers).pipe(shareReplay(1))
  const spawnEvent$: Observable<EntitySpawnEvent> = NEVER.pipe(
    startWith(undefined),
    map(() =>
      entityEvent(EntityEventType.spawn, {
        entity,
        initialTransform: spawnTrigger.initialTransform,
      }),
    ),
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
    map(({ control, transform }) => ({
      control,
      transform,
    })),
    distinctUntilChanged(
      (prev, current) =>
        prev.control === current.control && !EntityTransform.hasChanges(prev.transform, current.transform),
    ),
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
    initialTransform: readonlyProperty(spawnTrigger.initialTransform),
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
  deps: [
    Injector,
    EntitySpawnTrigger,
    Entity,
    EntityDef,
    TickTimedEntityState$,
    EntityDespawnTrigger$,
    WeaponsManager,
  ],
}

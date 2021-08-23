import { Injector, Provider } from '@dandi/core'
import { fromInjection } from '@dandi/rxjs'
import { INITIAL_POINT } from '@mp-server/shared'
import {
  Entity,
  EntityControlState$,
  EntityDef,
  EntityDefRegistry,
  EntitySpawnTrigger,
  EntitySpawnTriggers$,
  EntityTransform,
  EntityTransformManager,
  INITIAL_ENTITY_CONTROL_STATE,
  INITIAL_ENTITY_ROTATION,
  INITIAL_ENTITY_TRANSFORM,
  SpawnedEntities$,
} from '@mp-server/shared/entity'
import { map, mergeMap, of } from 'rxjs'

function calculateInitialTransform(def: EntityDef, sourceTransform?: EntityTransform): EntityTransform {
  sourceTransform = sourceTransform ?? INITIAL_ENTITY_TRANSFORM
  const { position, movement } = sourceTransform
  const velocity = EntityTransformManager.calculateAcceleration(
    def.config,
    movement.acceleration,
    position.orientation,
    -1,
  )
  return {
    rotation: INITIAL_ENTITY_ROTATION,
    position,
    movement: {
      acceleration: INITIAL_POINT,
      velocity,
    },
  }
}

function weaponProjectileEntitySpawnTriggerFactory(injector: Injector): EntitySpawnTriggers$ {
  const entities$: SpawnedEntities$ = fromInjection(injector, SpawnedEntities$).pipe(
    mergeMap((spawnedEntities$) => spawnedEntities$),
  )
  return entities$.pipe(
    mergeMap((sourceEntity) =>
      sourceEntity.fireWeapon$.pipe(
        map((event): EntitySpawnTrigger => {
          const entityId = `prj${Math.random()}`
          const entity: Entity = {
            entityId,
            entityDefKey: event.projectileDef.key,
          }
          const trigger = {
            entity,
            initialTransform: calculateInitialTransform(event.projectileDef, event.sourceTransform),
            providers: [
              {
                provide: EntityControlState$,
                useValue: of(INITIAL_ENTITY_CONTROL_STATE),
              },
              {
                provide: EntitySpawnTrigger,
                useFactory: () => trigger,
              },
            ],
          }
          return trigger
        }),
      ),
    ),
  )
}

export const WeaponProjectileEntitySpawnTriggers$Provider: Provider<EntitySpawnTriggers$> = {
  provide: EntitySpawnTriggers$,
  useFactory: weaponProjectileEntitySpawnTriggerFactory,
  deps: [Injector, EntityDefRegistry],
}

import { Provider } from '@dandi/core'
import {
  Entity,
  EntityDefRegistry,
  EntitySpawnTrigger,
  EntitySpawnTrigger$,
  SpawnedEntities$,
} from '@mp-server/shared/entity'
import { map, mergeMap } from 'rxjs'

function weaponProjectileEntitySpawnTriggerFactory(
  defs: EntityDefRegistry,
  entities$: SpawnedEntities$,
): EntitySpawnTrigger$ {
  return entities$.pipe(
    mergeMap((sourceEntity) =>
      sourceEntity.fireWeapon$.pipe(
        map((event): EntitySpawnTrigger => {
          const entityId = `prj${Math.random()}`
          const entity: Entity = {
            entityId,
            entityDefKey: event.projectileDef.key,
          }
          return {
            entity,
            initialTransform: event.sourceTransform,
          }
        }),
      ),
    ),
  )
}

export const WeaponProjectileEntitySpawnTriggerProvider: Provider<EntitySpawnTrigger$> = {
  provide: EntitySpawnTrigger$,
  useFactory: weaponProjectileEntitySpawnTriggerFactory,
  deps: [EntityDefRegistry, SpawnedEntities$],
}

import { Injector, Provider, ScopeRestriction } from '@dandi/core'
import { fromInjection } from '@dandi/rxjs'
import { merge, mergeMap, NEVER, pluck } from 'rxjs'
import { share } from 'rxjs/operators'

import { createEntityInjector, Entity, EntityScopeRequiredProviders } from './entity'
import { entityDefEntryProvider } from './entity-def'
import { MaxAgeDespawnTriggerProvider, MaxRangeDespawnTriggerProvider } from './entity-def-despawn-triggers'
import { EntityDefRegistry } from './entity-def-registry'
import { EntityDespawnTrigger$ } from './entity-despawn-trigger'
import { EntitySpawnTrigger, EntitySpawnTriggers$ } from './entity-spawn-trigger'
import { SpawnedEntities$, SpawnedEntity$ } from './spawned-entity'
import { SpawnedEntityParentInjectorFn } from './spawned-entity-parent-injector'

function entityProviders(
  defs: EntityDefRegistry,
  trigger: EntitySpawnTrigger,
): [EntityScopeRequiredProviders, ...Provider<unknown>[]] {
  const required: EntityScopeRequiredProviders = {
    entity: {
      provide: Entity,
      useValue: trigger.entity,
    },
  }
  const entityDef = defs.getValid(trigger.entity.entityDefKey)
  const additionalProviders: Provider<unknown>[] = [
    ...(trigger.providers ?? []),
    entityDefEntryProvider(entityDef),
    {
      provide: EntityDespawnTrigger$,
      useValue: trigger.despawnTrigger$ ?? NEVER,
    },
  ]
  if (entityDef.lifetime?.maxAgeMs) {
    additionalProviders.push(MaxAgeDespawnTriggerProvider)
  }
  if (entityDef.lifetime?.maxRange) {
    additionalProviders.push(MaxRangeDespawnTriggerProvider)
  }
  return [required, ...additionalProviders]
}

function spawnedEntitiesFactory(
  injector: Injector,
  defs: EntityDefRegistry,
  parentInjectorFn: SpawnedEntityParentInjectorFn,
  spawnTriggers: EntitySpawnTriggers$[],
): SpawnedEntity$ {
  return merge(...spawnTriggers).pipe(
    mergeMap((trigger) => {
      const parentInjector = parentInjectorFn(injector, trigger)
      const [requiredProviders, ...additionalProviders] = entityProviders(defs, trigger)
      const entityInjector = createEntityInjector(
        parentInjector,
        trigger.entity,
        requiredProviders,
        ...additionalProviders,
      )
      const despawnTrigger$ = trigger.despawnTrigger$?.pipe(pluck('key'))
      const injectedDespawnTrigger$ = fromInjection(entityInjector, EntityDespawnTrigger$, false, despawnTrigger$)
      const compositeDespawnTrigger$ = merge(
        despawnTrigger$ ?? NEVER,
        injectedDespawnTrigger$.pipe(mergeMap((despawnTriggers) => merge(...despawnTriggers))).pipe(pluck('key')),
      )

      return fromInjection(entityInjector, SpawnedEntity$, false, compositeDespawnTrigger$)
    }),
    mergeMap((spawnedEntity$) => spawnedEntity$),
    share(),
  )
}

export function spawnedEntitiesProvider(
  restrictScope?: ScopeRestriction,
  entityInjectorProvider?: Provider<Injector>,
): Provider<SpawnedEntities$> {
  const providers = []
  if (entityInjectorProvider) {
    providers.push(entityInjectorProvider)
  }
  return {
    provide: SpawnedEntities$,
    useFactory: spawnedEntitiesFactory,
    deps: [Injector, EntityDefRegistry, SpawnedEntityParentInjectorFn, EntitySpawnTriggers$],
    providers,
    restrictScope,
  }
}

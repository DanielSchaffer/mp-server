import { Provider } from '@dandi/core'
import { Point } from '@mp-server/shared'
import { filter, mapTo, pairwise, scan, shareReplay, take, timer } from 'rxjs'

import { EntityDef, EntityLifetime } from './entity-def'
import { EntityDespawnTrigger$, entityDespawnTriggerDefFactory } from './entity-despawn-trigger'
import { TickTimedEntityState$ } from './entity-state'
import { localToken } from './local-token'

const entityDefDespawnTriggerDefPrefix = `${localToken.PKG}#EntityDef` as const
const entityDefDespawnTriggerDef = entityDespawnTriggerDefFactory<
  typeof entityDefDespawnTriggerDefPrefix,
  keyof EntityLifetime
>(entityDefDespawnTriggerDefPrefix)

export const MaxAgeDespawnTriggerDef = entityDefDespawnTriggerDef('maxAgeMs')

// FIXME: need to use a different injection token for registering EntityDef entries vs getting current entity's EntityDef
function maxAgeDespawnTriggerFactory(entityDef: EntityDef): EntityDespawnTrigger$ {
  return timer(entityDef.lifetime.maxAgeMs).pipe(mapTo(MaxAgeDespawnTriggerDef), shareReplay(1))
}

export const MaxAgeDespawnTriggerProvider: Provider<EntityDespawnTrigger$> = {
  provide: EntityDespawnTrigger$,
  useFactory: maxAgeDespawnTriggerFactory,
  deps: [EntityDef],
}

export const MaxRangeDespawnTriggerDef = entityDefDespawnTriggerDef('maxRange')

function maxRangeDespawnTriggerFactory(
  entityDef: EntityDef,
  entityState$: TickTimedEntityState$,
): EntityDespawnTrigger$ {
  return entityState$.pipe(
    pairwise(),
    scan(
      (totalDistance, [prevState, curState]) =>
        totalDistance +
        Point.absTotal(Point.diff(prevState.transform.position.location, curState.transform.position.location)),
      0,
    ),
    filter((distance) => distance >= entityDef.lifetime.maxRange),
    take(1),
    mapTo(MaxRangeDespawnTriggerDef),
    shareReplay(1),
  )
}

export const MaxRangeDespawnTriggerProvider: Provider<EntityDespawnTrigger$> = {
  provide: EntityDespawnTrigger$,
  useFactory: maxRangeDespawnTriggerFactory,
  deps: [EntityDef, TickTimedEntityState$],
}

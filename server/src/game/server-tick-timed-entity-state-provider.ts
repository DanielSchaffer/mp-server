import { Provider } from '@dandi/core'
import { Entity, TickTimedEntityState$ } from '@mp-server/shared/entity'
import { TickUpdate$ } from '@mp-server/shared/server'
import { filter, map } from 'rxjs'

export const ServerTickTimedEntityState$Provider: Provider<TickTimedEntityState$> = {
  provide: TickTimedEntityState$,
  useFactory: (tickUpdate$: TickUpdate$, entity: Entity) =>
    tickUpdate$.pipe(
      filter(({ entityStates }) => !!entityStates[entity.entityId]),
      map(({ tick, entityStates }) => ({ timing: tick, ...entityStates[entity.entityId] })),
    ),
  deps: [TickUpdate$, Entity],
}

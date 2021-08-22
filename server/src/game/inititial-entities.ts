import { Provider } from '@dandi/core'
import { EntitySpawnData } from '@mp-server/shared/entity'
import { map, Observable, shareReplay, startWith, withLatestFrom } from 'rxjs'

import { localToken } from './local-token'
import { ServerActiveEntitiesMap$ } from './server-active-entities'
import { ServerEntityStateMap$ } from './server-entity-state'

export type InitialEntities$ = Observable<EntitySpawnData[]>
export const InitialEntities$ = localToken.opinionated<InitialEntities$>('InitialEntities$', {
  multi: false,
})

export function initialEntitiesFactory(
  activeEntities$: ServerActiveEntitiesMap$,
  entityStates$: ServerEntityStateMap$,
): Observable<EntitySpawnData[]> {
  return activeEntities$.pipe(
    withLatestFrom(entityStates$),
    map(([activeEntities, entityStates]) =>
      Object.values(activeEntities).map(({ entityId, entityDefKey }) => ({
        entity: {
          entityId,
          entityDefKey,
        },
        initialTransform: entityStates[entityId]?.transform,
      })),
    ),
    startWith([]),
    shareReplay(1),
  )
}

export const InitialEntities$Provider: Provider<InitialEntities$> = {
  provide: InitialEntities$,
  useFactory: initialEntitiesFactory,
  deps: [ServerActiveEntitiesMap$, ServerEntityStateMap$],
}

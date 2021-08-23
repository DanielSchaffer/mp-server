import { ChangedContainer, Point } from '@mp-server/shared'
import {
  EntityState,
  EntityTransform,
  INITIAL_ENTITY_CONTROL_STATE,
  INITIAL_ENTITY_TRANSFORM,
  mappedEntities,
  MappedEntities,
  SpawnedEntities$,
  SpawnedEntity,
} from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface ServerEntityState extends EntityState {
  entity: SpawnedEntity
}

export type ServerEntityStateMap = MappedEntities<ServerEntityState>

export type ServerEntityStateMap$ = Observable<ServerEntityStateMap>
export const ServerEntityStateMap$ = localToken.opinionated<ServerEntityStateMap$>('ServerEntityStateMap$', {
  multi: false,
})

function serverEntityStateMapFactory(entities$: SpawnedEntities$): ServerEntityStateMap$ {
  return mappedEntities(entities$, {
    spawn: (entity, event): ServerEntityState => ({
      entity,
      control: INITIAL_ENTITY_CONTROL_STATE,
      transform: (event.initialTransform as ChangedContainer<EntityTransform, Point>) ?? INITIAL_ENTITY_TRANSFORM,
    }),
    update: (entity, event) => ({
      entity,
      ...event.state,
    }),
  })
}

export const ServerEntityStateMap$Provider = {
  provide: ServerEntityStateMap$,
  useFactory: serverEntityStateMapFactory,
  deps: [SpawnedEntities$],
}

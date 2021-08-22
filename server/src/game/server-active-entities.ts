import {
  EntityEventType,
  MappedEntities,
  mappedEntities,
  SpawnedEntities$,
  SpawnedEntity,
} from '@mp-server/shared/entity'
import { Observable, shareReplay } from 'rxjs'

import { localToken } from './local-token'

export type ServerActiveEntitiesMap = MappedEntities<SpawnedEntity>

export type ServerActiveEntitiesMap$ = Observable<ServerActiveEntitiesMap>
export const ServerActiveEntitiesMap$ = localToken.opinionated<ServerActiveEntitiesMap$>(
  'ServerActiveEntitiesMap$',
  {
    multi: false,
  },
)

function serverActiveEntitiesMapFactory(entities$: SpawnedEntities$): ServerActiveEntitiesMap$ {
  return mappedEntities(
    entities$,
    {
      spawn: (entity) => entity,
    },
    EntityEventType.spawn,
    EntityEventType.despawn,
  ).pipe(shareReplay(1))
}

export const ServerActiveEntitiesMap$Provider = {
  provide: ServerActiveEntitiesMap$,
  useFactory: serverActiveEntitiesMapFactory,
  deps: [SpawnedEntities$],
}

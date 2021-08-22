import { filter, map, mergeMap, Observable, shareReplay } from 'rxjs'
import { scan } from 'rxjs/operators'

import { EntityEvent, EntityEventType, EntitySpawnEvent, EntityStateUpdateEvent } from './entity-event'
import { SpawnedEntities$, SpawnedEntity } from './spawned-entity'

export type MappedEntities<TValue> = { [entityId: string]: TValue }

export type EntityMappingFn<TValue, TEvent extends EntityEvent> = (entity: SpawnedEntity, event: TEvent) => TValue

export interface EntityMapping<TValue> {
  spawn?: EntityMappingFn<TValue, EntitySpawnEvent>
  update?: EntityMappingFn<TValue, EntityStateUpdateEvent>
}

export function mappedEntities<TValue>(
  entities$: SpawnedEntities$,
  mapping: EntityMapping<TValue>,
  ...events: EntityEventType[]
): Observable<MappedEntities<TValue>> {
  return entities$.pipe(
    mergeMap((entity) => {
      const event$ = events.length
        ? entity.event$.pipe(filter((event) => events.includes(event.type)))
        : entity.event$
      return event$.pipe(map((event) => [entity, event] as const))
    }),
    scan((result, [entity, event]) => {
      const update = (value: TValue): MappedEntities<TValue> => ({ ...result, ...{ [entity.entityId]: value } })
      if (event.type === EntityEventType.spawn) {
        if (mapping.spawn !== undefined) {
          const spawnData = mapping.spawn(entity, event)
          if (spawnData) {
            return update(spawnData)
          }
        }
        return result
      }
      if (event.type === EntityEventType.stateUpdate) {
        if (mapping.update !== undefined) {
          return update(mapping.update(entity, event))
        }
        return result
      }
      if (event.type === EntityEventType.despawn) {
        const updated = { ...result }
        delete updated[entity.entityId]
        return updated
      }
      return result
    }, {} as MappedEntities<TValue>),
    shareReplay(1),
  )
}

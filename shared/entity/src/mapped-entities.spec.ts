import { stub } from '@dandi/core/testing'
import { Vehicle } from '@mp-server/shared/entities'
import {
  Entity,
  EntityEvent,
  EntityEventType,
  EntityMapping,
  MappedEntities,
  mappedEntities,
  SpawnedEntity,
} from '@mp-server/shared/entity'
import { MarbleValues } from '@rxjs-stuff/marbles'
import { expect } from 'chai'
import { filter, map, NEVER } from 'rxjs'

describe.marbles('mappedEntities', ({ cold }) => {
  const mapping: EntityMapping<Entity> = {
    spawn: stub().returnsArg(0),
    update: stub().returnsArg(0),
  }

  const entityId = (() => {
    let id = 0
    return () => `iam.${id++}`
  })()

  function entity(eventMarbles: string): SpawnedEntity {
    const entity: Entity = {
      entityId: entityId(),
      entityDefKey: Vehicle.key,
    }
    const eventMarbleValues: MarbleValues<EntityEvent> = {
      d: {
        type: EntityEventType.despawn,
        entity,
      },
      s: {
        type: EntityEventType.spawn,
        entity,
      },
      u: {
        type: EntityEventType.stateUpdate,
        entity,
        state: undefined,
      },
    }
    const event$ = cold(eventMarbles, eventMarbleValues)
    const despawn$ = event$.pipe(
      filter((event) => event.type === EntityEventType.despawn),
      map(() => spawnedEntity),
    )
    const spawnedEntity: SpawnedEntity = Object.assign(
      {
        def: Vehicle,
        injector: undefined,

        despawn$,
        event$,
        fireWeapon$: NEVER,
        state$: NEVER,
      },
      entity,
    )
    return spawnedEntity
  }

  it('emits an updated map when entities are added', () => {
    const spawnedEntities = {
      e: entity('s'),
    }
    const spawnedEntities$ = cold('--e', spawnedEntities)
    const result$ = mappedEntities(spawnedEntities$, mapping)
    const expectedMarbleValues: MarbleValues<MappedEntities<Entity>> = {
      a: {
        [spawnedEntities.e.entityId]: spawnedEntities.e,
      },
    }

    expect(result$).with.marbleValues(expectedMarbleValues).to.equal('--a')
  })

  it('emits an updated map when entities are updated', () => {
    const spawnedEntities = {
      e: entity('s--u'),
    }
    const spawnedEntities$ = cold('--e', spawnedEntities)
    const result$ = mappedEntities(spawnedEntities$, mapping)
    const expectedMarbleValues: MarbleValues<MappedEntities<Entity>> = {
      s: {
        [spawnedEntities.e.entityId]: spawnedEntities.e,
      },
      u: {
        [spawnedEntities.e.entityId]: spawnedEntities.e,
      },
    }

    expect(result$).with.marbleValues(expectedMarbleValues).to.equal('--s--u')
  })

  it('removes entities when they despawn', () => {
    const spawnedEntities = {
      e: entity('s--d'),
    }
    const spawnedEntities$ = cold('--e', spawnedEntities)
    const result$ = mappedEntities(spawnedEntities$, mapping)
    const expectedMarbleValues: MarbleValues<MappedEntities<Entity>> = {
      s: {
        [spawnedEntities.e.entityId]: spawnedEntities.e,
      },
      d: {},
    }

    expect(result$).with.marbleValues(expectedMarbleValues).to.equal('--s--d')
  })
})

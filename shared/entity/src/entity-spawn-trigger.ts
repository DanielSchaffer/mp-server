import { Provider } from '@dandi/core'
import { Observable } from 'rxjs'

import { Entity } from './entity'
import { EntityDespawnTrigger$ } from './entity-despawn-trigger'
import { EntityTransform } from './entity-transform'
import { localToken } from './local-token'

export interface EntitySpawnData {
  entity: Entity
  initialTransform?: EntityTransform
}

export interface EntitySpawnTrigger extends EntitySpawnData {
  despawnTrigger$?: EntityDespawnTrigger$
  providers?: Provider<unknown>[]
}

export type EntitySpawnTrigger$ = Observable<EntitySpawnTrigger>
export const EntitySpawnTrigger$ = localToken.opinionated<EntitySpawnTrigger$>('EntitySpawnTrigger$', {
  multi: true,
})

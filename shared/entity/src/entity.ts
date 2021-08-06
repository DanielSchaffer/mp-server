import {
  defineScope,
  scopedInjectorFactory,
  scopeInstanceFactory,
  ScopeRequiredProviders,
  scopeRequiredTokens,
} from '@mp-server/common/dandi'
import { Observable } from 'rxjs'

import { EntityProfile } from './entity-profile'
import { localToken } from './local-token'

export type EntityId = string

export interface EntityScopeData extends EntityProfile {
  // TODO: switch to symbol after TypeScript 4.4
  entityId: EntityId
}

const ENTITY_SCOPE = `${localToken.PKG}#Entity`
export const EntityScope = defineScope(ENTITY_SCOPE)
export type EntityScope = typeof EntityScope

export interface EntityScopeInstance extends EntityScope, EntityScopeData {}

export const createEntityScope = scopeInstanceFactory<EntityScope, EntityScopeInstance>(EntityScope)

export interface Entity extends EntityScopeData {
  destroy$: Observable<void>
}

export const Entity = localToken.opinionated<Entity>('Entity', {
  multi: false,
  restrictScope: EntityScope,
})

export const EntityId = localToken.opinionated<EntityId>('Entity', {
  multi: false,
  restrictScope: EntityScope,
})

export const EntityScopeRequiredTokens = scopeRequiredTokens({
  EntityId,
  EntityProfile,
})
export type EntityScopeRequiredTokens = typeof EntityScopeRequiredTokens
export type EntityScopeRequiredProviders = ScopeRequiredProviders<EntityScopeRequiredTokens>

export const createEntityInjector = scopedInjectorFactory<
  EntityScope,
  EntityScopeInstance,
  EntityScopeRequiredTokens
>(EntityScope)

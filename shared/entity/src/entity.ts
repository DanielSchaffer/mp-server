import {
  defineScope,
  scopedInjectorFactory,
  ScopeRequiredProviders,
  scopeRequiredTokens,
} from '@mp-server/common/dandi'

import { localToken } from './local-token'

export type EntityId = string

export interface EntityScopeData {
  // TODO: switch to symbol after TypeScript 4.4
  readonly entityId: EntityId
}

const ENTITY_SCOPE = `${localToken.PKG}#Entity`
export const EntityScope = defineScope(ENTITY_SCOPE)
export type EntityScope = typeof EntityScope

export interface EntityScopeInstance extends EntityScope, EntityScopeData {}

export interface Entity extends EntityScopeData {
  readonly entityDefKey: string
}

export const Entity = localToken.opinionated<Entity>('Entity', {
  multi: false,
  restrictScope: EntityScope,
})

export const EntityId = localToken.opinionated<EntityId>('EntityId', {
  multi: false,
  restrictScope: EntityScope,
})

export const EntityScopeRequiredTokens = scopeRequiredTokens({
  Entity,
})
export type EntityScopeRequiredTokens = typeof EntityScopeRequiredTokens
export type EntityScopeRequiredProviders = ScopeRequiredProviders<EntityScopeRequiredTokens>

export const createEntityInjector = scopedInjectorFactory<
  EntityScope,
  EntityScopeInstance,
  EntityScopeRequiredTokens
>(EntityScope)

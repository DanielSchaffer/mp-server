import {
  defineScope,
  scopedInjectorFactory,
  ScopeRequiredProviders,
  scopeRequiredTokens,
} from '@mp-server/common/dandi'
import { EntityScopeData } from '@mp-server/shared/entity'

import { localToken } from './local-token'

export interface ClientEntityScopeInstance extends ClientEntityScope, EntityScopeData {}

const CLIENT_ENTITY_SCOPE = `${localToken.PKG}#ClientEntity`
export const ClientEntityScope = defineScope(CLIENT_ENTITY_SCOPE)
export type ClientEntityScope = typeof ClientEntityScope

export interface ClientEntityData extends EntityScopeData {
  isLocalClient: boolean
}

export const ClientEntityData = localToken.opinionated<ClientEntityData>('ClientEntityData', {
  multi: false,
  restrictScope: ClientEntityScope,
})

export const ClientEntityScopeRequiredTokens = scopeRequiredTokens({
  ClientEntityData,
})
export type ClientEntityScopeRequiredTokens = typeof ClientEntityScopeRequiredTokens
export type ClientEntityScopeRequiredProviders = ScopeRequiredProviders<ClientEntityScopeRequiredTokens>

export const createClientEntityInjector = scopedInjectorFactory<
  ClientEntityScope,
  ClientEntityScopeInstance,
  ClientEntityScopeRequiredTokens
>(ClientEntityScope)

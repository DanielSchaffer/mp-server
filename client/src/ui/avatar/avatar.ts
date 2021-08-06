import { Provider } from '@dandi/core'
import { defineScope, scopeInstanceFactory } from '@mp-server/common/dandi'
import { EntityId, EntityState, EntityTransformCalculationTrigger$ } from '@mp-server/shared/entity'

import { localToken } from './local-token'

export type AvatarEntityId = EntityId

export interface AvatarScopeData {
  avatarEntityId: AvatarEntityId
}

export interface AvatarData extends AvatarScopeData {
  isLocalClient: boolean
}

export const AvatarScope = defineScope(`${localToken.PKG}#Avatar`)
export type AvatarScope = typeof AvatarScope

export interface AvatarScopeInstance extends AvatarScope, AvatarScopeData {}

export const createAvatarScope = scopeInstanceFactory<AvatarScope, AvatarScopeInstance>(AvatarScope)

export const AvatarEntityId = localToken.opinionated<AvatarEntityId>('AvatarEntityId', {
  multi: false,
  restrictScope: AvatarScope,
})

export const AvatarData = localToken.opinionated<AvatarData>('AvatarData', {
  multi: false,
  restrictScope: AvatarScope,
})

export interface Avatar extends AvatarData, EntityState {
  el: HTMLDivElement
}

export type AvatarEntityConditionalProviders = [
  Provider<EntityTransformCalculationTrigger$>,
  ...Provider<unknown>[]
]
export const AvatarEntityConditionalProviders = localToken.opinionated<AvatarEntityConditionalProviders>(
  'AvatarEntityConditionalProviders',
  {
    multi: false,
    restrictScope: AvatarScope,
  },
)

import { Provider } from '@dandi/core'
import { EntityTransformCalculationTrigger$ } from '@mp-server/shared/entity'

import { ClientEntityScope } from './client-entity'
import { localToken } from './local-token'

export type ClientEntityConditionalProviders = [
  Provider<EntityTransformCalculationTrigger$>,
  ...Provider<unknown>[]
]
export const ClientEntityConditionalProviders = localToken.opinionated<ClientEntityConditionalProviders>(
  'ClientEntityConditionalProviders',
  {
    multi: false,
    restrictScope: ClientEntityScope,
  },
)

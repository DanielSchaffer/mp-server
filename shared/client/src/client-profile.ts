import { EntityProfile } from '@mp-server/shared/entity'

import { ClientScope } from './client'
import { localToken } from './local-token'

export type ClientProfile = EntityProfile

export const ClientProfile = localToken.opinionated<ClientProfile>('ClientProfile', {
  multi: false,
  restrictScope: ClientScope,
})

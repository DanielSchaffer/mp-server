import { EntitySpawnData } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { ClientId, ClientProfile, ClientScope } from './client'
import { localToken } from './local-token'

export interface ClientConfig {
  clientId: ClientId
  tickInterval: number
  initialEntities: EntitySpawnData[]
  profile: ClientProfile
}

export type ClientConfig$ = Observable<ClientConfig>
export const ClientConfig$ = localToken.opinionated<ClientConfig$>('ClientConfig$', {
  multi: false,
  restrictScope: ClientScope,
})

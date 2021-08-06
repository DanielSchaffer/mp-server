import { Provider } from '@dandi/core'
import { EntityScopeData } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { ClientId, ClientScope } from './client'
import { ClientProfile } from './client-profile'
import { localToken } from './local-token'

export interface ClientConfig {
  clientId: ClientId
  tickInterval: number
  initialEntities: EntityScopeData[]
  profile: ClientProfile
}

export type ClientConfig$ = Observable<ClientConfig>
export const ClientConfig$ = localToken.opinionated<ClientConfig$>('ClientConfig$', {
  multi: false,
  restrictScope: ClientScope,
})

export function clientConfigProvider(config$: Observable<ClientConfig>): Provider<Observable<ClientConfig>> {
  return {
    provide: ClientConfig$,
    useValue: config$,
  }
}

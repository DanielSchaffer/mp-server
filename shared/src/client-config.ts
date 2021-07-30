import { Provider } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'
import { ClientId } from './client'

export interface ClientConfig {
  clientId: ClientId
  tickInterval: number
}

export const ClientConfig = localToken.opinionated<Observable<ClientConfig>>('ClientConfig', {
  multi: false,
})

export function clientConfigProvider(config$: Observable<ClientConfig>): Provider<Observable<ClientConfig>> {
  return {
    provide: ClientConfig,
    useValue: config$,
  }
}

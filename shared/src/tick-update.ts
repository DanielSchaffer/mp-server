import { Provider } from '@dandi/core'
import { ClientId, ClientInputStateMap, TickTiming } from '@mp-server/shared'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface TickUpdate {
  tick: TickTiming
  clientInputs: ClientInputStateMap
  addedClients: ClientId[]
  removedClients: ClientId[]
}

export const TickUpdate = localToken.opinionated<Observable<TickUpdate>>('TickUpdate', {
  multi: false,
})

export function tickUpdateProvider(tickUpdate$: Observable<TickUpdate>): Provider<Observable<TickUpdate>> {
  return {
    provide: TickUpdate,
    useValue: tickUpdate$,
  }
}

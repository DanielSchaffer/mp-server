import { TickTiming } from '@mp-server/shared'
import { EntityStateMap } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface TickUpdate<TTiming extends TickTiming = TickTiming> {
  tick: TTiming
  entityStates: EntityStateMap
}

export type TickUpdate$ = Observable<TickUpdate>
export const TickUpdate$ = localToken.opinionated<TickUpdate$>('TickUpdate$', {
  multi: false,
})

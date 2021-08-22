import { Provider } from '@dandi/core'
import { TickTiming$ } from '@mp-server/shared'
import { TickUpdate, TickUpdate$ } from '@mp-server/shared/server'
import { map, withLatestFrom } from 'rxjs'
import { share } from 'rxjs/operators'

import { ServerEntityStateMap$ } from './server-entity-state'

function serverTickUpdateFactory(tick$: TickTiming$, entityStates$: ServerEntityStateMap$): TickUpdate$ {
  return tick$.pipe(
    withLatestFrom(entityStates$),
    map(
      ([tick, entityStates]): TickUpdate => ({
        tick,
        entityStates,
      }),
    ),
    share(),
  )
}

export const ServerTickUpdate$Provider: Provider<TickUpdate$> = {
  provide: TickUpdate$,
  useFactory: serverTickUpdateFactory,
  deps: [TickTiming$, ServerEntityStateMap$],
}

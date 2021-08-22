import { Provider } from '@dandi/core'
import { EntityControlState$, TickTimedEntityState$ } from '@mp-server/shared/entity'
import { pluck, shareReplay } from 'rxjs'

function serverEntityControlStateFactory(entityState: TickTimedEntityState$): EntityControlState$ {
  return entityState.pipe(pluck('control'), shareReplay(1))
}

export const ServerEntityControlState$Provider: Provider<EntityControlState$> = {
  provide: EntityControlState$,
  useFactory: serverEntityControlStateFactory,
  deps: [TickTimedEntityState$],
}

import { Provider } from '@dandi/core'
import { EntityTransformManager, TickTimedEntityState$ } from '@mp-server/shared/entity'

export const ServerTickTimedEntityState$Provider: Provider<TickTimedEntityState$> = {
  provide: TickTimedEntityState$,
  // TODO: update factory to add transform validation
  useFactory: (transformManager: EntityTransformManager) => transformManager.transform$,
  deps: [EntityTransformManager],
}

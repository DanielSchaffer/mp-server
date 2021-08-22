import { Provider } from '@dandi/core'

import { Entity } from './entity'
import { EntityDef } from './entity-def'
import { EntityDefRegistry } from './entity-def-registry'

function entityDefFactory(defs: EntityDefRegistry, entity: Entity): EntityDef {
  return defs.getValid(entity.entityDefKey)
}

export const EntityDefProvider: Provider<EntityDef> = {
  provide: EntityDef,
  useFactory: entityDefFactory,
  deps: [EntityDefRegistry, Entity],
}

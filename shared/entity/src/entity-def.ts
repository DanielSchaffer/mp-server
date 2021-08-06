import { Provider } from '@dandi/core'

import { EntityTransformConfig } from './entity-transform-config'
import { localToken } from './local-token'

export interface EntityDef {
  readonly key: string
  readonly config: EntityTransformConfig
}

export const EntityDef = localToken.opinionated<EntityDef>('EntityDef', {
  multi: true,
})

export function entityDefProvider(def: EntityDef): Provider<EntityDef> {
  return {
    provide: EntityDef,
    useValue: def,
  }
}

import { Provider } from '@dandi/core'
import { hasOwnProperty } from '@mp-server/common'

import { EntityScope } from './entity'

import { EntityTransform } from './entity-transform'
import { EntityTransformConfig } from './entity-transform-config'
import { localToken } from './local-token'

export interface EntityLifetime {
  readonly maxAgeMs?: number
  readonly maxRange?: number
}

export interface EntityDef {
  readonly key: string
  readonly config: EntityTransformConfig
  readonly initialTransformState?: Partial<EntityTransform>
  readonly lifetime?: EntityLifetime
}

export const EntityDef = localToken.opinionated<EntityDef>('EntityDef', {
  multi: false,
  restrictScope: EntityScope,
})

export interface WeaponConfig {
  fireRate: number
  entityDef: EntityDef
}

export interface ArmedEntityDef extends EntityDef {
  readonly primaryWeapon: WeaponConfig
  readonly secondaryWeapon: WeaponConfig
}

export function isArmedEntity(obj: EntityDef): obj is ArmedEntityDef {
  return hasOwnProperty(obj, 'primaryWeapon', 'secondaryWeapon')
}

export const EntityDefEntry = localToken.opinionated<EntityDef>('EntityDefEntry', {
  multi: true,
})

export function entityDefEntryProvider(def: EntityDef): Provider<EntityDef> {
  return {
    provide: EntityDefEntry,
    useValue: def,
  }
}

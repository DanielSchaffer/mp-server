import { EntityScope } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface EntityDespawnTrigger<TKey extends string = string> {
  readonly key: TKey
}

export type EntityDespawnTrigger$ = Observable<EntityDespawnTrigger>
export const EntityDespawnTrigger$ = localToken.opinionated<EntityDespawnTrigger$>('EntityDespawnTrigger$', {
  multi: true,
  restrictScope: EntityScope,
})

const TRIGGER_DEFS = new Map<string, EntityDespawnTrigger>()

export function entityDespawnTriggerDef<TKey extends string>(key: TKey): EntityDespawnTrigger<TKey> {
  if (TRIGGER_DEFS.has(key)) {
    throw new Error(`Duplicate EntityDespawnTriggerDef key '${key}'`)
  }
  const def = { key }
  TRIGGER_DEFS.set(key, def)
  return def
}

export function entityDespawnTriggerDefFactory<TPrefix extends string, TDetail extends string = string>(
  prefix: TPrefix,
) {
  return <TKey extends TDetail>(key: TKey): EntityDespawnTrigger<`${TPrefix}.${TKey}`> =>
    entityDespawnTriggerDef(`${prefix}.${key}` as const)
}

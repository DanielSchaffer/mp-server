import { Inject, Injectable } from '@dandi/core'

import { EntityDef, EntityDefEntry } from './entity-def'

import { DuplicateEntityDefEntryError, MissingEntityDefError } from './entity-def-error'

@Injectable()
export class EntityDefRegistry {
  private readonly map = new Map<string, EntityDef>()

  constructor(@Inject(EntityDefEntry) public readonly defs: EntityDef[]) {
    defs.forEach((def) => {
      if (this.map.has(def.key)) {
        throw new DuplicateEntityDefEntryError(def.key, def)
      }
      this.map.set(def.key, def)
    })
  }

  public get(key: string): EntityDef {
    return this.map.get(key)
  }

  public getValid(key: string): EntityDef {
    if (!this.has(key)) {
      throw new MissingEntityDefError(key)
    }
    return this.get(key)
  }

  public has(key: string): boolean {
    return this.map.has(key)
  }
}

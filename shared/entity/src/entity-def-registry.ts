import { Inject, Injectable } from '@dandi/core'
import { EntityDef } from '@mp-server/shared/entity'

@Injectable()
export class EntityDefRegistry {
  private readonly map = new Map<string, EntityDef>()

  constructor(@Inject(EntityDef) public readonly defs: EntityDef[]) {
    defs.forEach((def) => {
      if (this.map.has(def.key)) {
        throw new Error(`Duplicate EntityDef for key '${def.key}'`)
      }
      this.map.set(def.key, def)
    })
  }

  public get(key: string): EntityDef {
    return this.map.get(key)
  }

  public has(key: string): boolean {
    return this.map.has(key)
  }
}

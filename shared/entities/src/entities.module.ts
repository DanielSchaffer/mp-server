import { ModuleBuilder, Registerable } from '@dandi/core'
import { EntityDef, entityDefEntryProvider } from '@mp-server/shared/entity'

import { localToken } from './local-token'
import { StaticProjectile } from './static-projectile'
import { Vehicle } from './vehicle'

class EntitiesModuleBuilder extends ModuleBuilder<EntitiesModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(EntitiesModuleBuilder, localToken.PKG, ...entries)
  }

  public withEntities(...defs: EntityDef[]): this {
    return this.add(...defs.map(entityDefEntryProvider))
  }

  public withAllEntities(): this {
    return this.withEntities(StaticProjectile, Vehicle)
  }
}

export const EntitiesModule = new EntitiesModuleBuilder()

import { ModuleBuilder, Registerable } from '@dandi/core'

import { AvatarEntityProviders } from './avatar-entity-providers'
import { AvatarManagerImpl } from './avatar-manager'

import { localToken } from './local-token'

class AvatarModuleBuilder extends ModuleBuilder<AvatarModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(AvatarModuleBuilder, localToken.PKG, ...entries)
  }
}

export const AvatarModule = new AvatarModuleBuilder(AvatarEntityProviders, AvatarManagerImpl)

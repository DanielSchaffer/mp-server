import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'

class AvatarModuleBuilder extends ModuleBuilder<AvatarModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(AvatarModuleBuilder, localToken.PKG, ...entries)
  }
}

export const AvatarModule = new AvatarModuleBuilder(
)

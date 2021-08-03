import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'

class ClientSharedModuleBuilder extends ModuleBuilder<ClientSharedModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ClientSharedModuleBuilder, localToken.PKG, ...entries)
  }
}

export const ClientSharedModule = new ClientSharedModuleBuilder(
)

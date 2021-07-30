import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { DocumentProvider } from './document-provider'

class UiModuleBuilder extends ModuleBuilder<UiModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(UiModuleBuilder, localToken.PKG, ...entries)
  }
}

export const UiModule = new UiModuleBuilder(
  DocumentProvider,
)

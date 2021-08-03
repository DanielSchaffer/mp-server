import { Constructor } from '@dandi/common'
import { ModuleBuilder, Provider, Registerable } from '@dandi/core'
import { SharedModule } from '@mp-server/shared'
import { ClientScope } from '@mp-server/shared/client'

import { AnimationFramesSubtickTimingSourceProvider } from './animation-frames-subtick-timing-source'
import { ClientControlsManager } from './client-controls-manager'
import { ClientInput } from './client-input'
import { GameUi } from './game-ui'
import { localToken } from './local-token'

class ClientUiGameModuleBuilder extends ModuleBuilder<ClientUiGameModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ClientUiGameModuleBuilder, localToken.PKG, ...entries)
  }

  public useInput(...inputs: (Constructor<ClientInput> | Provider<ClientInput>)[]): this {
    return this.add(...inputs)
  }
}

export const ClientUiGameModule = new ClientUiGameModuleBuilder(
  ClientControlsManager,
  GameUi,
  SharedModule.config({
    subtickTimingSource: AnimationFramesSubtickTimingSourceProvider,
    tickTimingScope: ClientScope,
  }),
)

import { ModuleBuilder, Provider, Registerable } from '@dandi/core'
import { Constructor } from '@dandi/common'
import { SharedModule } from '@mp-server/shared'

import { AnimationFramesSubtickTimingSourceProvider } from './animation-frames-subtick-timing-source'
import { ClientInput } from './client-input'
import { ClientInputManager } from './client-input-manager'
import { GameScope } from './game'
import { GameUi } from './game-ui'
import { localToken } from './local-token'

class ClientUiGameModuleBuilder extends ModuleBuilder<ClientUiGameModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ClientUiGameModuleBuilder, localToken.PKG, ...entries);
  }

  public useInput(...inputs: (Constructor<ClientInput> | Provider<ClientInput>)[]): this {
    return this.add(...inputs)
  }
}

export const ClientUiGameModule = new ClientUiGameModuleBuilder(
  ClientInputManager,
  GameUi,
  SharedModule.config({
    subtickTimingSource: AnimationFramesSubtickTimingSourceProvider,
    tickTimingScope: GameScope,
  }),
)

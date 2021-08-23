import { Constructor } from '@dandi/common'
import { ModuleBuilder, Provider, Registerable } from '@dandi/core'
import { SharedModule } from '@mp-server/shared'
import { ClientScope } from '@mp-server/shared/client'

import { AnimationFramesSubtickTimingSourceProvider } from './animation-frames-subtick-timing-source'
import { ClientControlsManager } from './client-controls-manager'
import { ClientEntityProviders } from './client-entity-providers'
import { ClientInput } from './client-input'
import { ServerUpdateEntitySpawnTriggers$Provider } from './entity-trigger-providers'
import { GameUi } from './game-ui'
import { localToken } from './local-token'

class ClientUiModuleBuilder extends ModuleBuilder<ClientUiModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(ClientUiModuleBuilder, localToken.PKG, ...entries)
  }

  public useInput(...inputs: (Constructor<ClientInput> | Provider<ClientInput>)[]): this {
    return this.add(...inputs)
  }
}

export const ClientUiModule = new ClientUiModuleBuilder(
  ClientControlsManager,
  ClientEntityProviders,
  GameUi,
  SharedModule.config({
    subtickTimingSource: AnimationFramesSubtickTimingSourceProvider,
    tickTimingScope: ClientScope,
  }),
  ServerUpdateEntitySpawnTriggers$Provider,
)

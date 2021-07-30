import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { WebSocketClientConfig } from './web-socket-client-config'

class WebSocketClientModuleBuilder extends ModuleBuilder<WebSocketClientModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(WebSocketClientModuleBuilder, localToken.PKG, ...entries)
  }

  public config(config: WebSocketClientConfig): this {
    return this.add({
      provide: WebSocketClientConfig,
      useValue: config,
    })
  }
}

export const WebSocketClientModule = new WebSocketClientModuleBuilder()

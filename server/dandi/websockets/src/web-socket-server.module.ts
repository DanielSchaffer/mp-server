import { ModuleBuilder, Registerable } from '@dandi/core'

import { localToken } from './local-token'
import { WebSocketServer } from './web-socket-server'
import { WebSocketServerConfig } from './web-socket-server-config'
import { WebSocketServiceManager } from './web-socket-service-manager'

class WebSocketServerModuleBuilder extends ModuleBuilder<WebSocketServerModuleBuilder> {
  constructor(...entries: Registerable[]) {
    super(WebSocketServerModuleBuilder, localToken.PKG, ...entries)
  }

  public config(config: WebSocketServerConfig): this {
    return this.add({
      provide: WebSocketServerConfig,
      useValue: config,
    })
  }
}

export const WebSocketServerModule = new WebSocketServerModuleBuilder(WebSocketServer, WebSocketServiceManager)

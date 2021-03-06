import { ServerOptions } from 'ws'
import { InjectionToken } from '@dandi/core'
import { localToken } from './local-token'

export type WebSocketServerConfig = Omit<ServerOptions, 'server'>

export const WebSocketServerConfig: InjectionToken<WebSocketServerConfig> = localToken.opinionated('WebSocketServerConfig', {
  multi: false,
})

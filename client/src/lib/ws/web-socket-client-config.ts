import { localToken } from './local-token'

export interface WebSocketClientConfig {
  endpoint: string
}

export const WebSocketClientConfig = localToken.opinionated<WebSocketClientConfig>('WebSocketClientConfig', {
  multi: false,
})

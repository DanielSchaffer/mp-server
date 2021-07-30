import { CustomInjectionScope } from '@dandi/core'

import { ClientId } from './client'

const CLIENT_SCOPE = '@mp-server/shared#Client'

export interface ClientScope extends CustomInjectionScope {
  description: typeof CLIENT_SCOPE
}

export interface ClientScopeInstance extends ClientScope {
  clientId: ClientId
}

export const ClientScope: ClientScope = {
  description: CLIENT_SCOPE,
  type: Symbol.for(CLIENT_SCOPE),
}

export function createClientScope(clientId: ClientId): ClientScopeInstance {
  return Object.assign({ clientId }, ClientScope)
}

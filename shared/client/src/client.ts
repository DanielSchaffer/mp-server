import { defineScope, scopeInstanceFactory } from '@mp-server/common/dandi'
import { Observable } from 'rxjs'

import { ClientProfile } from './client-profile'
import { localToken } from './local-token'

export interface ClientScopeData extends ClientProfile {
  clientId: string
}

export type ClientId = ClientScopeData['clientId']

const CLIENT_SCOPE = '@mp-server/shared/client#Client'
export const ClientScope = defineScope(CLIENT_SCOPE)
export type ClientScope = typeof ClientScope

export interface ClientScopeInstance extends ClientScope, ClientScopeData {}

export const createClientScope = scopeInstanceFactory<ClientScope, ClientScopeInstance>(ClientScope)

export const ClientId = localToken.opinionated<ClientId>('ClientId', {
  multi: false,
  restrictScope: ClientScope,
})

export interface Client<TMessage = unknown, TDisconnect extends TMessage | unknown = unknown>
  extends ClientScopeData {
  message$: Observable<TMessage>
  disconnect$: Observable<TDisconnect>
}

export const Client = localToken.opinionated<Client>('Client', {
  multi: false,
  restrictScope: ClientScope,
})

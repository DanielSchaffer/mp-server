import { ClientRequest, IncomingMessage } from 'http'

import { Uuid } from '@dandi/common'

import { WebSocketConnection, WebSocketConnectionClose } from '@dandi/websockets'
import { defineScope, scopeInstanceFactory } from '@mp-server/common/dandi'
import { json } from '@mp-server/shared'
import { ClientId, ClientMessage, ClientProfile } from '@mp-server/shared/client'
import { ServerMessage } from '@mp-server/shared/server'

import { Observable } from 'rxjs'

import WebSocket = require('ws')

import { localToken } from './local-token'

export interface ClientConnectionScopeData {
  connectionId: Uuid
}

const CLIENT_CONNECTION_SCOPE = `${localToken.PKG}#ClientConnection` as const
export const ClientConnectionScope = defineScope(CLIENT_CONNECTION_SCOPE)
export type ClientConnectionScope = typeof ClientConnectionScope

export interface ClientConnectionScopeInstance extends ClientConnectionScope, ClientConnectionScopeData {}

export const createClientConnectionScope = scopeInstanceFactory<
  ClientConnectionScope,
  ClientConnectionScopeInstance
>(ClientConnectionScope)

export type ClientSocketConnection$ = Observable<ClientSocketConnection>
export const ClientSocketConnection$ = localToken.opinionated<ClientSocketConnection$>('ClientSocketConnection$', {
  multi: false,
  restrictScope: ClientConnectionScope,
})

export type ClientSocketConnections$ = Observable<ClientSocketConnection>
export const ClientSocketConnections$ = localToken.opinionated<ClientSocketConnections$>(
  'ClientSocketConnections$',
  {
    multi: false,
  },
)

export class ClientSocketConnection implements WebSocketConnection<ClientMessage> {
  public readonly connectionId: Uuid
  public readonly close$: Observable<WebSocketConnectionClose>
  public readonly message$: Observable<ClientMessage>
  public readonly open$: Observable<WebSocket>
  public readonly ping$: Observable<Buffer>
  public readonly pong$: Observable<Buffer>
  public readonly socket$: Observable<WebSocket>
  public readonly unexpectedResponse$: Observable<[ClientRequest, IncomingMessage]>
  public readonly upgrade$: Observable<IncomingMessage>
  public readonly request: IncomingMessage

  constructor(
    protected readonly conn: WebSocketConnection,
    public readonly clientId: ClientId,
    public readonly profile: ClientProfile,
    clientMessage$: Observable<ClientMessage>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message$, ...connProps } = conn
    Object.assign(this, connProps)
    this.message$ = clientMessage$
  }

  public close(code?: number, data?: string): void {
    this.conn.close(code, data)
  }

  public send(msg: ServerMessage | string): Observable<void> {
    const data = typeof msg === 'string' ? msg : json.stringify(msg)
    return this.conn.send(data)
  }
}

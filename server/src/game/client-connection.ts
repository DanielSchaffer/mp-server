import {
  ClientId,
  ClientMessage,
  ClientMessageType,
  ClientRegistration, json,
  ServerMessage,
  ServerMessageType
} from '@mp-server/shared'
import { ClientRequest, IncomingMessage } from 'http'
import { filter, finalize, map, merge, Observable, of, shareReplay, take } from 'rxjs'
import WebSocket = require('ws')
import { mergeMap, share } from 'rxjs/operators'

import { WebSocketConnection, WebSocketConnectionClose } from '../../dandi/websockets'

import { GameServerConfig } from './game-server-config'

export class ClientConnection implements WebSocketConnection<ClientMessage> {

  public static register(config: GameServerConfig, conn: WebSocketConnection): Observable<ClientConnection> {
    const message$ = conn.message$.pipe(
      map(data => json.parse<ClientMessage>(data.toString())),
      share(),
    )
    return message$.pipe(
      take(1),
      filter(function (msg: ClientMessage): msg is ClientRegistration {
        if (msg.type === ClientMessageType.register) {
          return true
        }
        conn.close(1011, 'First message must be "register"')
        return false
      }),
      mergeMap(({ clientId }) => {
        const clientConn = new ClientConnection(conn, clientId, message$)
        return merge(
          clientConn.send({ type: ServerMessageType.clientInit, config: { clientId, tickInterval: config.tickInterval }}),
          of(clientConn),
        )
      }),
      shareReplay(1),
      finalize(() => console.warn('connection finalized')),
    )
  }

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
    clientMessage$: Observable<ClientMessage>,
  ) {
    const { message$, ...connProps } = conn
    Object.assign(this, connProps)
    this.message$ = clientMessage$
  }

  public close(code?: number, data?: string): void {
    this.conn.close(code, data)
  }

  public send(msg: ServerMessage | string): Observable<never> {
    const data = typeof msg === 'string' ? msg : json.stringify(msg)
    return this.conn.send(data)
  }
}

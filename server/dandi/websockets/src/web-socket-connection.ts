import { ClientRequest, IncomingMessage } from 'http'
import WebSocket = require('ws')
import { defer, mergeMap, Observable, shareReplay, takeUntil } from 'rxjs'
import { share } from 'rxjs/operators'

export interface WebSocketConnectionClose {
  code: number
  reason: string
}

export interface WebSocketConnection<TMessage = WebSocket.Data> {
  readonly close$: Observable<WebSocketConnectionClose>
  readonly socket$: Observable<WebSocket>
  readonly upgrade$: Observable<IncomingMessage>
  readonly message$: Observable<TMessage>
  readonly open$: Observable<WebSocket>
  readonly ping$: Observable<Buffer>
  readonly pong$: Observable<Buffer>
  readonly unexpectedResponse$: Observable<[ClientRequest, IncomingMessage]>
  close(code?: number, data?: string): void
  send(data: string): Observable<never>
}

class WebSocketConnectionImpl implements WebSocketConnection {
  public readonly close$: Observable<WebSocketConnectionClose>
  public readonly socket$: Observable<WebSocket>
  public readonly upgrade$: Observable<IncomingMessage>
  public readonly message$: Observable<WebSocket.Data>
  public readonly open$: Observable<WebSocket>
  public readonly ping$: Observable<Buffer>
  public readonly pong$: Observable<Buffer>
  public readonly unexpectedResponse$: Observable<[ClientRequest, IncomingMessage]>

  constructor(protected readonly socket: WebSocket, public readonly request: IncomingMessage) {
    this.close$ = new Observable<WebSocketConnectionClose>(o => {
      this.socket.on('close', (code, reason) => {
        o.next({ code, reason })
        o.complete()
      })
    }).pipe(
      shareReplay(),
    )

    this.socket$ = new Observable<WebSocket>(o => {
      this.socket.on('error', err => o.error(err))
      o.next(this.socket)
      return () => this.socket.close(0, 'No more subscriptions')
    }).pipe(
      takeUntil(defer(() => this.close$)),
      shareReplay(1),
    )

    this.upgrade$ = this.socket$.pipe(
      mergeMap(socket => new Observable<IncomingMessage>(o => {
        socket.on('upgrade', request => o.next(request))
      }))
    )

    this.message$ = this.socket$.pipe(
      mergeMap(socket => new Observable<WebSocket.Data>(o => {
        socket.on('message', data => o.next(data))
      })),
      share(),
    )

    this.open$ = this.socket$.pipe(
      mergeMap(socket => new Observable<WebSocket>(o => {
        socket.on('open', () => o.next(socket))
      })),
      share(),
    )

    this.ping$ = this.socket$.pipe(
      mergeMap(socket => new Observable<Buffer>(o => {
        socket.on('ping', data => o.next(data))
      })),
      share(),
    )

    this.pong$ = this.socket$.pipe(
      mergeMap(socket => new Observable<Buffer>(o => {
        socket.on('pong', data => o.next(data))
      })),
      share(),
    )

    this.unexpectedResponse$ = this.socket$.pipe(
      mergeMap(socket => new Observable<[ClientRequest, IncomingMessage]>(o => {
        socket.on('unexpected-response', (clientRequest, request) => o.next([clientRequest, request]))
      })),
      share(),
    )
  }

  public send(data: string): Observable<never> {
    return new Observable(o => {
      this.socket.send(data, err => {
        if (err) {
          o.error(err)
          return
        }
        o.complete()
      })
    })
  }

  public close(code?: number, data?: string): void {
    this.socket.close(code, data)
  }
}

export const WebSocketConnection = WebSocketConnectionImpl

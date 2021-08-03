import { IncomingMessage } from 'http'

import { Inject, Injectable, Logger } from '@dandi/core'
import { HttpServer } from '@dandi/http-pipeline'
import { silence } from '@mp-server/common/rxjs'

import { defer, mergeMap, Observable, of, share, shareReplay, switchMap, take, tap } from 'rxjs'
import { Server } from 'ws'

import WebSocket = require('ws')

import { WebSocketConnection } from './web-socket-connection'
import { WebSocketServerConfig } from './web-socket-server-config'

export interface WebSocketHeaders {
  headers: string[]
  request: IncomingMessage
}

@Injectable()
export class WebSocketServer {
  public readonly server$: Observable<Server>
  public readonly connection$: Observable<WebSocketConnection>
  public readonly headers$: Observable<WebSocketHeaders>
  public readonly message$: Observable<WebSocket.Data>
  public readonly listening$: Observable<Server>

  constructor(
    @Inject(HttpServer) private readonly httpServer: HttpServer,
    @Inject(WebSocketServerConfig) private readonly config: WebSocketServerConfig,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.server$ = defer(() => of(new Server({ ...config, server: httpServer }))).pipe(
      switchMap(
        (server) =>
          new Observable<Server>((o) => {
            server.on('close', () => o.complete())
            server.on('error', (err) => o.error(err))
            o.next(server)
            return () => server.close()
          }),
      ),
      tap(() => this.logger.debug('server initialized', this.config)),
      shareReplay(1),
    )

    this.listening$ = this.server$.pipe(
      switchMap(
        (server) =>
          new Observable<Server>((o) => {
            server.on('listening', () => o.next(server))
          }),
      ),
      tap(() => this.logger.debug('listening', this.config)),
      share(),
    )

    this.connection$ = this.listening$.pipe(
      switchMap(
        (server) =>
          new Observable<WebSocketConnection>((o) => {
            server.on('connection', (socket, request) => {
              o.next(new WebSocketConnection(socket, request))
              this.logger.debug('connection', request.headers)
            })
          }),
      ),
      share(),
    )

    this.headers$ = this.listening$.pipe(
      switchMap(
        (server) =>
          new Observable<WebSocketHeaders>((o) => {
            server.on('headers', (headers, request) => {
              o.next({ headers, request })
            })
          }),
      ),
    )

    this.message$ = this.connection$.pipe(mergeMap((conn) => conn.message$))
  }

  public broadcast(data: string): Observable<never> {
    return this.server$.pipe(
      take(1),
      tap((server) => {
        server.clients.forEach((client) => {
          client.send(data)
        })
      }),
      silence(),
    )
  }
}

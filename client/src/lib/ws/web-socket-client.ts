import { Inject, Injectable, Logger } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { Observable, shareReplay, mergeMap, fromEvent, share, tap, mapTo } from 'rxjs'

import { WebSocketClientConfig } from './web-socket-client-config'

@Injectable()
export class WebSocketClient {
  
  public readonly socket$: Observable<WebSocket>
  public readonly open$: Observable<WebSocket>
  public readonly message$: Observable<MessageEvent>
  
  constructor(
    @Inject(WebSocketClientConfig) protected readonly config: WebSocketClientConfig,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    this.socket$ = new Observable<WebSocket>(o => {
      const socket = new WebSocket(config.endpoint)
      socket.addEventListener('error', err => o.error(err))
      socket.addEventListener('close', () => o.complete())
      o.next(socket)
      return () => socket.close()
    }).pipe(
      shareReplay(1),
    )
    this.open$ = this.socket$.pipe(
      mergeMap(socket => fromEvent(socket, 'open').pipe(mapTo(socket))),
      tap(() => {
        console.log('connection open')
        this.logger.debug('connection open')
      }),
      shareReplay(1),
    )
    this.message$ = this.socket$.pipe(
      mergeMap(socket => fromEvent<MessageEvent>(socket, 'message')),
      share(),
    )
  }

  public send(data: string): Observable<never> {
    return this.open$.pipe(
      tap(socket => socket.send(data)),
      silence(),
    )
  }
  
}

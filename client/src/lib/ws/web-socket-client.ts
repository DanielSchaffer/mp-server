import { Inject, Injectable, Logger } from '@dandi/core'
import { fromEvent, mapTo, mergeMap, Observable, share, shareReplay, take, takeUntil, tap } from 'rxjs'

import { WebSocketClientConfig } from './web-socket-client-config'

@Injectable()
export class WebSocketClient {
  public readonly socket$: Observable<WebSocket>
  public readonly open$: Observable<WebSocket>
  public readonly close$: Observable<void>
  public readonly message$: Observable<MessageEvent>

  constructor(
    @Inject(WebSocketClientConfig) protected readonly config: WebSocketClientConfig,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    this.socket$ = new Observable<WebSocket>((o) => {
      const socket = new WebSocket(config.endpoint)
      socket.addEventListener('error', (err) => o.error(err))
      o.next(socket)
      return () => socket.close()
    }).pipe(shareReplay(1))
    this.close$ = this.socket$.pipe(
      mergeMap((socket) => fromEvent(socket, 'close')),
      mapTo(undefined),
      tap(() => this.logger.debug('connection closed')),
      shareReplay(1),
    )
    this.open$ = this.socket$.pipe(
      mergeMap((socket) => fromEvent(socket, 'open').pipe(mapTo(socket))),
      tap(() => this.logger.debug('connection open')),
      takeUntil(this.close$),
      shareReplay(1),
    )
    this.message$ = this.open$.pipe(
      mergeMap((socket) => fromEvent<MessageEvent>(socket, 'message')),
      share(),
    )
  }

  public send(data: string): Observable<void> {
    return this.open$.pipe(
      tap((socket) => socket.send(data)),
      mapTo(undefined),
      take(1),
      share(),
    )
  }
}

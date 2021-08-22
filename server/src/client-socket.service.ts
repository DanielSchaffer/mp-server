import { Inject, Injectable } from '@dandi/core'

import { WebSocketServer, WebSocketService } from '@dandi/websockets'
import { Observable } from 'rxjs'

@Injectable(WebSocketService)
export class ClientSocketService implements WebSocketService {
  public readonly name: string = 'ClientSocketService'
  public readonly run$: Observable<never>

  constructor(@Inject(WebSocketServer) private readonly server: WebSocketServer) {}
}

import { Inject, Injectable } from '@dandi/core'
import { audit, filter, map, Observable, shareReplay } from 'rxjs'

import { WebSocketServer, WebSocketService } from '../dandi/websockets'

@Injectable(WebSocketService)
export class ClientSocketService implements WebSocketService {

  public readonly name: string = 'ClientSocketService'
  public readonly run$: Observable<never>

  constructor(@Inject(WebSocketServer) private readonly server: WebSocketServer) {

  }

}

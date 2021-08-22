import { ExpressMvcApplication } from '@dandi-contrib/mvc-express'
import { EntryPoint, Inject, Injectable } from '@dandi/core'

import { WebSocketServiceManager } from '@dandi/websockets'

@Injectable(EntryPoint)
export class HybridWebApplication implements EntryPoint {
  constructor(
    @Inject(WebSocketServiceManager) private readonly webSockets: WebSocketServiceManager,
    @Inject(ExpressMvcApplication) private readonly mvc: ExpressMvcApplication,
  ) {}

  public async run(): Promise<any> {
    this.webSockets.run()
    return await this.mvc.run()
  }
}

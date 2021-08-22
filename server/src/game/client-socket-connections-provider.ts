import { Injector, Provider } from '@dandi/core'
import { fromInjection } from '@dandi/rxjs'
import { WebSocketServer } from '@dandi/websockets'
import { mapTo, mergeMap, shareReplay } from 'rxjs'

import {
  ClientSocketConnection$,
  ClientSocketConnections$,
  createClientConnectionScope,
} from './client-socket-connection'
import { clientSocketConnectionProvider } from './client-socket-connection-provider'

function clientSocketConnectionsFactory(injector: Injector, server: WebSocketServer): ClientSocketConnections$ {
  return server.connection$.pipe(
    mergeMap((conn) => {
      const scope = createClientConnectionScope(conn)
      const childInjector = injector.createChild(scope, [clientSocketConnectionProvider(conn)])
      return fromInjection(
        childInjector,
        ClientSocketConnection$,
        false,
        conn.close$.pipe(mapTo('socket connection closed')),
      ).pipe(
        mergeMap((conn$) => conn$),
        shareReplay(1),
      )
    }),
  )
}

export const ClientSocketConnections$Provider: Provider<ClientSocketConnections$> = {
  provide: ClientSocketConnections$,
  useFactory: clientSocketConnectionsFactory,
  deps: [Injector, WebSocketServer],
}

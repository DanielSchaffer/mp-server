import { Inject, Injectable, Injector, Logger, RestrictScope } from '@dandi/core'

import { from, mergeMap, NEVER, Observable, shareReplay, startWith, takeUntil } from 'rxjs'

import { Client, ClientId, ClientScope, createClientScope } from './client'
import { localToken } from './local-token'

export interface ClientManager<TMessage = unknown, TDisconnect extends TMessage | unknown = unknown> {
  readonly client$: Observable<Client<TMessage, TDisconnect>>
}

export const ClientManager = localToken.opinionated<ClientManager>('ClientManager', {
  multi: false,
  restrictScope: ClientScope,
})

export class ClientManagerFacade<TMessage = unknown, TDisconnect extends TMessage | unknown = unknown>
  implements ClientManager<TMessage, TDisconnect> {
  public readonly client$: Observable<Client<TMessage, TDisconnect>>

  public static create<TMessage = unknown, TDisconnect extends TMessage | unknown = unknown>(
    injector: Injector,
    clientId: ClientId,
    entityDefKey: string,
    message$: Observable<TMessage>,
    disconnect$: Observable<TDisconnect>,
  ): ClientManager<TMessage, TDisconnect> {
    const scope = createClientScope({
      clientId,
      entityDefKey,
    })
    const client: Client<TMessage, TDisconnect> = {
      clientId,
      entityDefKey,
      message$,
      disconnect$,
    }
    const connectedClientInjector = injector.createChild(scope, [
      {
        provide: Client,
        useValue: client,
      },
    ])
    return new ClientManagerFacade<TMessage, TDisconnect>(
      from(connectedClientInjector.inject(ClientManager) as Promise<ClientManager<TMessage, TDisconnect>>).pipe(
        takeUntil(disconnect$),
        shareReplay(1),
      ),
    )
  }

  protected constructor(protected readonly manager$: Observable<ClientManager<TMessage, TDisconnect>>) {
    this.client$ = manager$.pipe(
      mergeMap((manager) => manager.client$),
      shareReplay(1),
    )
  }
}

@Injectable(ClientManager, RestrictScope(ClientScope))
export class ConnectedClientManagerImpl<TMessage = unknown, TDisconnect extends TMessage | unknown = unknown>
  implements ClientManager<TMessage, TDisconnect> {
  public readonly clientId: ClientId

  public readonly client$: Observable<Client<TMessage, TDisconnect>>
  public readonly disconnect$: Observable<TDisconnect>
  public readonly message$: Observable<TMessage>

  constructor(
    @Inject(Client) client: Client<TMessage, TDisconnect>,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    this.clientId = client.clientId

    this.client$ = NEVER.pipe(startWith(client), takeUntil(client.disconnect$), shareReplay(1))
    this.disconnect$ = client.disconnect$
  }
}

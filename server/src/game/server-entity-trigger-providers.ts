import { Provider } from '@dandi/core'
import {
  Entity,
  EntityDefRegistry,
  EntityDespawnTrigger$,
  entityDespawnTriggerDefFactory,
  EntitySpawnTrigger$,
} from '@mp-server/shared/entity'
import { mapTo, mergeMap, of, shareReplay, takeUntil } from 'rxjs'
import { share } from 'rxjs/operators'

import { ClientSocketConnection, ClientSocketConnections$ } from './client-socket-connection'
import { localToken } from './local-token'

const clientConnectionDespawnTriggerDefPrefix = `${localToken.PKG}#ClientSocketConnection` as const
const clientConnectionDespawnTriggerDef = entityDespawnTriggerDefFactory<
  typeof clientConnectionDespawnTriggerDefPrefix,
  keyof ClientSocketConnection
>(clientConnectionDespawnTriggerDefPrefix)

const ClientConnectionClosedDespawnTriggerDef = clientConnectionDespawnTriggerDef('close$')

function clientConnectionEntitySpawnTriggerFactory(
  defs: EntityDefRegistry,
  conn$: ClientSocketConnections$,
): EntitySpawnTrigger$ {
  return conn$.pipe(
    mergeMap((conn) => {
      const despawnTrigger$: EntityDespawnTrigger$ = conn.close$.pipe(
        mapTo(ClientConnectionClosedDespawnTriggerDef),
        shareReplay(1),
      )
      const entity: Entity = {
        entityId: conn.clientId,
        entityDefKey: conn.profile.entityDefKey,
      }

      return of({
        despawnTrigger$,
        entity,
      }).pipe(takeUntil(despawnTrigger$), shareReplay(1))
    }),
    share(),
  )
}

export const ServerUpdateEntitySpawnTriggerProvider: Provider<EntitySpawnTrigger$> = {
  provide: EntitySpawnTrigger$,
  useFactory: clientConnectionEntitySpawnTriggerFactory,
  deps: [EntityDefRegistry, ClientSocketConnections$],
}

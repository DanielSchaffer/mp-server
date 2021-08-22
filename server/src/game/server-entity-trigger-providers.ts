import { Provider } from '@dandi/core'
import { ClientMessageType } from '@mp-server/shared/client'
import {
  ControlledEntityTransformCalculation,
  Entity,
  EntityControlState$,
  EntityDefRegistry,
  EntityDespawnTrigger$,
  entityDespawnTriggerDefFactory,
  EntitySpawnTrigger$,
} from '@mp-server/shared/entity'
import { filter, mapTo, mergeMap, of, pluck, shareReplay, takeUntil } from 'rxjs'
import { share } from 'rxjs/operators'

import { ClientSocketConnection, ClientSocketConnections$ } from './client-socket-connection'
import { localToken } from './local-token'

const clientConnectionDespawnTriggerDefPrefix = `${localToken.PKG}#ClientSocketConnection` as const
const clientConnectionDespawnTriggerDef = entityDespawnTriggerDefFactory<
  typeof clientConnectionDespawnTriggerDefPrefix,
  keyof ClientSocketConnection
>(clientConnectionDespawnTriggerDefPrefix)

const ClientConnectionClosedDespawnTriggerDef = clientConnectionDespawnTriggerDef('close$')

function clientEntityProviders(conn: ClientSocketConnection): Provider<unknown>[] {
  return [
    {
      provide: EntityControlState$,
      useValue: conn.message$.pipe(
        filter((msg) => msg.type === ClientMessageType.controlStateChange),
        pluck('controlState'),
        share(),
      ),
    },
    ControlledEntityTransformCalculation,
  ]
}

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

      const providers = clientEntityProviders(conn)

      return of({
        despawnTrigger$,
        entity,
        providers,
      }).pipe(takeUntil(despawnTrigger$), shareReplay(1))
    }),
    share(),
  )
}

export const ServerUpdateEntitySpawnTrigger$Provider: Provider<EntitySpawnTrigger$> = {
  provide: EntitySpawnTrigger$,
  useFactory: clientConnectionEntitySpawnTriggerFactory,
  deps: [EntityDefRegistry, ClientSocketConnections$],
}

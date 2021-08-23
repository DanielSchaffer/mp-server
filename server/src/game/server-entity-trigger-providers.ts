import { Provider } from '@dandi/core'
import { ClientMessageType } from '@mp-server/shared/client'
import {
  ControlledEntityTransformCalculation,
  Entity,
  EntityControlState$,
  EntityDefRegistry,
  EntityDespawnTrigger$,
  entityDespawnTriggerDefFactory,
  EntitySpawnTrigger,
  EntitySpawnTriggers$,
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
): EntitySpawnTriggers$ {
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

      const trigger = {
        despawnTrigger$,
        entity,
        providers: [
          ...clientEntityProviders(conn),
          {
            provide: EntitySpawnTrigger,
            useFactory: (): EntitySpawnTrigger => trigger,
          },
        ],
      }

      return of(trigger).pipe(takeUntil(despawnTrigger$), shareReplay(1))
    }),
    share(),
  )
}

export const ServerUpdateEntitySpawnTrigger$Provider: Provider<EntitySpawnTriggers$> = {
  provide: EntitySpawnTriggers$,
  useFactory: clientConnectionEntitySpawnTriggerFactory,
  deps: [EntityDefRegistry, ClientSocketConnections$],
}

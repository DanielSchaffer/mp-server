import { ClientScope } from '@mp-server/shared/client'
import {
  EntityDespawnTrigger$,
  entityDespawnTriggerDefFactory,
  EntitySpawnData,
  EntitySpawnTrigger,
  EntitySpawnTriggers$,
} from '@mp-server/shared/entity'
import { filter, from, map, mapTo, merge, Observable, shareReplay, switchMap, take } from 'rxjs'

import { GameClientConnection } from './game-client-connection'
import { localToken } from './local-token'

const serverUpdateDespawnTriggerDefPrefix = `${localToken.PKG}#GameClientConnection` as const
const serverUpdateDespawnTriggerDef = entityDespawnTriggerDefFactory<
  typeof serverUpdateDespawnTriggerDefPrefix,
  keyof GameClientConnection
>(serverUpdateDespawnTriggerDefPrefix)

const EntityRemovedDespawnTriggerDef = serverUpdateDespawnTriggerDef('removeEntity$')

function serverUpdateEntitySpawnTriggerProvider(conn: GameClientConnection): EntitySpawnTriggers$ {
  const initialEntities$ = conn.config$.pipe(
    take(1),
    switchMap((config) => from(config.initialEntities)),
  )
  const addEntity$: Observable<EntitySpawnData> = merge(conn.addEntity$, initialEntities$)

  return addEntity$.pipe(
    map(({ entity, initialTransform }) => {
      const despawnTrigger$: EntityDespawnTrigger$ = conn.removeEntity$.pipe(
        filter((removeMsg) => removeMsg.entityId === entity.entityId),
        mapTo(EntityRemovedDespawnTriggerDef),
        shareReplay(1),
      )
      const trigger = {
        despawnTrigger$,
        entity,
        initialTransform,
        providers: [
          {
            provide: EntitySpawnTrigger,
            useFactory: () => trigger,
          },
        ],
      }
      return trigger
    }),
  )
}

export const ServerUpdateEntitySpawnTriggers$Provider = {
  provide: EntitySpawnTriggers$,
  useFactory: serverUpdateEntitySpawnTriggerProvider,
  deps: [GameClientConnection],
  restrictScope: ClientScope,
}

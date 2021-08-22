import { ClientScope } from '@mp-server/shared/client'
import {
  EntityDespawnTrigger$,
  entityDespawnTriggerDefFactory,
  EntitySpawnData,
  EntitySpawnTrigger$,
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

function serverUpdateEntitySpawnTriggerProvider(conn: GameClientConnection): EntitySpawnTrigger$ {
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
      return {
        despawnTrigger$,
        entity,
        initialTransform,
      }
    }),
  )
}

export const ServerUpdateEntitySpawnTriggerProvider = {
  provide: EntitySpawnTrigger$,
  useFactory: serverUpdateEntitySpawnTriggerProvider,
  deps: [GameClientConnection],
  restrictScope: ClientScope,
}

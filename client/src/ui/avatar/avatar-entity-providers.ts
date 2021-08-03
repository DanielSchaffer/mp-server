import { InjectionScope, Injector } from '@dandi/core'
import {
  Entity,
  EntityId,
  EntityScopeRequiredProviders,
  EntityTransformCalculationTrigger$,
} from '@mp-server/shared/entity'
import { filter, mapTo, shareReplay, take } from 'rxjs'

import { GameClientConnection } from '../../game-client-connection'

import { AvatarEntityTransformCalculationTriggerProviders } from './avatar'

// function entityTickStateFactory(
//   avatarData: AvatarData,
//   tickUpdate$: Observable<TickUpdate>,
// ): TickTimedEntityState$ {
//   return tickUpdate$.pipe(
//     map(({ tick, entityStates }) => Object.assign({ timing: tick }, entityStates[avatarData.avatarEntityId])),
//     shareReplay(1),
//   )
// }
//
// function entityControlStateFactory(
//   avatarData: AvatarData,
//   entityState$: TickTimedEntityState$,
//   clientControls: ClientControlsManager,
// ): Observable<EntityControlState> {
//   if (avatarData.isLocalClient) {
//     return clientControls.input$
//   }
//   return entityState$.pipe(pluck('control'), startWith(INITIAL_ENTITY_CONTROL_STATE), shareReplay(1))
// }
//
// function entityTickTransformFactory(entityState$: TickTimedEntityState$): EntityTickTransform$ {
//   return entityState$.pipe(
//     map(({ control, timing, transform }) =>
//       Object.assign(
//         {
//           control,
//           timing,
//         },
//         transform,
//       ),
//     ),
//     shareReplay(1),
//   )
// }

function entityTransformCalculationTriggerFactory(
  injector: Injector,
  scope: InjectionScope,
  providers: AvatarEntityTransformCalculationTriggerProviders,
): Promise<EntityTransformCalculationTrigger$> {
  return injector.createChild(scope, providers).inject(EntityTransformCalculationTrigger$)
}

function entityFactory(conn: GameClientConnection, entityId: EntityId): Entity {
  const destroy$ = conn.removeEntity$.pipe(
    filter((remove) => remove.entityId === entityId),
    mapTo(undefined),
    take(1),
    shareReplay(1),
  )
  return {
    entityId,
    destroy$,
  }
}

export const AvatarEntityProviders = [
  {
    provide: Entity,
    useFactory: entityFactory,
    deps: [GameClientConnection, EntityId],
  },
  {
    provide: EntityTransformCalculationTrigger$,
    useFactory: entityTransformCalculationTriggerFactory,
    async: true,
    deps: [Injector, InjectionScope, AvatarEntityTransformCalculationTriggerProviders],
  },
  // {
  //   provide: TimedEntityTickState$,
  //   useFactory: entityTickStateFactory,
  //   deps: [AvatarData, TickUpdate$],
  // },
  // {
  //   provide: EntityControlState$,
  //   useFactory: entityControlStateFactory,
  //   deps: [AvatarData, TimedEntityTickState$, ClientControlsManager],
  // },
  // {
  //   provide: EntityTickTransform$,
  //   useFactory: entityTickTransformFactory,
  //   deps: [TimedEntityTickState$],
  // },
]

export function avatarEntityProviders(entityId: EntityId): EntityScopeRequiredProviders {
  return {
    entityId: {
      provide: EntityId,
      useValue: entityId,
    },
  }
}

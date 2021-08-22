import { Provider } from '@dandi/core'
import { ClientConfig$ } from '@mp-server/shared/client'
import {
  ControlledValidatedEntityTransformCalculation,
  Entity,
  EntityId,
  ReportedEntityTransformationCalculation,
  TickTimedEntityState$,
} from '@mp-server/shared/entity'
import { filter, firstValueFrom, map } from 'rxjs'

import { ClientControlsManager } from './client-controls-manager'
import { ClientEntityData } from './client-entity'
import { ClientEntityConditionalProviders } from './client-entity-conditional-providers'
import { GameClientConnection } from './game-client-connection'

function clientEntityDataFactory(config$: ClientConfig$, entityId: EntityId): Promise<ClientEntityData> {
  const data$ = config$.pipe(
    map((config) => {
      const isLocalClient = config.clientId === entityId
      return {
        entityId,
        isLocalClient,
      }
    }),
  )
  return firstValueFrom(data$)
}

const TickTimedEntityState$Provider: Provider<TickTimedEntityState$> = {
  provide: TickTimedEntityState$,
  useFactory: (conn: GameClientConnection, entity: Entity) =>
    conn.tickUpdate$.pipe(
      filter(({ entityStates }) => !!entityStates[entity.entityId]),
      map(({ tick, entityStates }) => ({ timing: tick, ...entityStates[entity.entityId] })),
    ),
  deps: [GameClientConnection, Entity],
}

export function clientEntityConditionalProvidersFactory(isLocalClient: boolean): ClientEntityConditionalProviders {
  return isLocalClient
    ? [
        ControlledValidatedEntityTransformCalculation,
        ClientControlsManager.entityControlState$Provider,
        TickTimedEntityState$Provider,
      ]
    : [ReportedEntityTransformationCalculation, TickTimedEntityState$Provider]
}

// function entityTransformCalculationTriggerFactory(
//   injector: Injector,
//   scope: InjectionScope,
//   providers: ClientEntityConditionalProviders,
// ): Promise<EntityTransformCalculationTrigger$> {
//   return injector.createChild(scope, providers).inject(EntityTransformCalculationTrigger$)
// }
//
// function tickTimedEntityStateFactory(
//   injector: Injector,
//   scope: InjectionScope,
//   providers: ClientEntityConditionalProviders,
// ): Promise<TickTimedEntityState$> {
//   return injector.createChild(scope, providers).inject(TickTimedEntityState$)
// }

export type ClientEntityProviders = [Provider<ClientEntityConditionalProviders>]

export const ClientEntityProviders: ClientEntityProviders = [
  {
    provide: ClientEntityConditionalProviders,
    useFactory: clientEntityConditionalProvidersFactory,
    deps: [ClientEntityData],
  },
  // {,
  //   provide: EntityTransformCalculationTrigger$,
  //   useFactory: entityTransformCalculationTriggerFactory,
  //   async: true,
  //   deps: [Injector, InjectionScope, AvatarEntityConditionalProviders],
  // },
  // {
  //   provide: TickTimedEntityState$,
  //   useFactory: tickTimedEntityStateFactory,
  //   async: true,
  //   deps: [Injector, InjectionScope, AvatarEntityConditionalProviders],
  // },
]

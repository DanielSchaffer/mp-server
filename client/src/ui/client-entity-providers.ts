import { Provider } from '@dandi/core'
import {
  ControlledValidatedEntityTransformCalculation,
  Entity,
  EntityControlState$,
  ReportedEntityTransformationCalculation,
  TickTimedEntityState$,
} from '@mp-server/shared/entity'
import { filter, map, pluck } from 'rxjs'

import { ClientControlsManager } from './client-controls-manager'
import { ClientEntityData } from './client-entity'
import { ClientEntityConditionalProviders } from './client-entity-conditional-providers'
import { GameClientConnection } from './game-client-connection'

const TickTimedEntityState$Provider: Provider<TickTimedEntityState$> = {
  provide: TickTimedEntityState$,
  useFactory: (conn: GameClientConnection, entity: Entity) =>
    conn.tickUpdate$.pipe(
      filter(({ entityStates }) => !!entityStates[entity.entityId]),
      map(({ tick, entityStates }) => ({ timing: tick, ...entityStates[entity.entityId] })),
    ),
  deps: [GameClientConnection, Entity],
}

const ReportedEntityControlState$Provider = {
  provide: EntityControlState$,
  useFactory: (state$: TickTimedEntityState$) => state$.pipe(pluck('control')),
  deps: [TickTimedEntityState$],
}

export function clientEntityConditionalProvidersFactory(isLocalClient: boolean): ClientEntityConditionalProviders {
  return isLocalClient
    ? [
        ControlledValidatedEntityTransformCalculation,
        ClientControlsManager.entityControlState$Provider,
        TickTimedEntityState$Provider,
      ]
    : [ReportedEntityTransformationCalculation, TickTimedEntityState$Provider, ReportedEntityControlState$Provider]
}

export type ClientEntityProviders = [Provider<ClientEntityConditionalProviders>]

export const ClientEntityProviders: ClientEntityProviders = [
  {
    provide: ClientEntityConditionalProviders,
    useFactory: clientEntityConditionalProvidersFactory,
    deps: [ClientEntityData],
  },
]

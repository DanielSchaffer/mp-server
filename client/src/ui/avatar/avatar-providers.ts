import { Provider } from '@dandi/core'
import { ClientConfig$ } from '@mp-server/shared/client'
import {
  ControlledEntityTransformCalculation,
  EntityId,
  ReportedEntityTransformationCalculation,
  TickTimedEntityState$,
} from '@mp-server/shared/entity'
import { filter, firstValueFrom, map } from 'rxjs'

import { GameClientConnection } from '../../game-client-connection'

import { ClientControlsManager } from '../game'

import { AvatarData, AvatarEntityId, AvatarEntityTransformCalculationTriggerProviders } from './avatar'

function avatarDataFactory(config$: ClientConfig$, avatarEntityId: AvatarEntityId): Promise<AvatarData> {
  const data$ = config$.pipe(
    map((config) => {
      const isLocalClient = config.clientId === avatarEntityId
      return {
        avatarEntityId,
        isLocalClient,
      }
    }),
  )
  return firstValueFrom(data$)
}

function avatarEntityTransformCalculationTriggerProvidersFactory({
  isLocalClient,
}: AvatarData): AvatarEntityTransformCalculationTriggerProviders {
  return isLocalClient
    ? [ControlledEntityTransformCalculation, ClientControlsManager.entityControlState$Provider]
    : [
        ReportedEntityTransformationCalculation,
        {
          provide: TickTimedEntityState$,
          useFactory: (conn: GameClientConnection, avatarEntityId: AvatarEntityId) =>
            conn.tickUpdate$.pipe(
              filter(({ entityStates }) => !!entityStates[avatarEntityId]),
              map(({ tick, entityStates }) => ({ timing: tick, ...entityStates[avatarEntityId] })),
            ),
          deps: [GameClientConnection, AvatarEntityId],
        },
      ]
}

export type AvatarProviders = [
  Provider<EntityId>,
  Provider<AvatarData>,
  Provider<AvatarEntityTransformCalculationTriggerProviders>,
]

export function avatarProviders(entityId: EntityId): AvatarProviders {
  return [
    {
      provide: AvatarEntityId,
      useValue: entityId,
    },
    {
      provide: AvatarData,
      useFactory: avatarDataFactory,
      async: true,
      deps: [ClientConfig$, AvatarEntityId],
    },
    {
      provide: AvatarEntityTransformCalculationTriggerProviders,
      useFactory: avatarEntityTransformCalculationTriggerProvidersFactory,
      deps: [AvatarData],
    },
  ]
}

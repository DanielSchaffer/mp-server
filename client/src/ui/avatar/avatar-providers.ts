import { Provider } from '@dandi/core'
import { ClientConfig$ } from '@mp-server/shared/client'
import {
  ControlledValidatedEntityTransformCalculation,
  EntityId,
  ReportedEntityTransformationCalculation,
  TickTimedEntityState$,
} from '@mp-server/shared/entity'
import { filter, firstValueFrom, map } from 'rxjs'

import { GameClientConnection } from '../../game-client-connection'

import { ClientControlsManager } from '../game'

import { AvatarData, AvatarEntityConditionalProviders, AvatarEntityId } from './avatar'

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

const TickTimedEntityState$Provider: Provider<TickTimedEntityState$> = {
  provide: TickTimedEntityState$,
  useFactory: (conn: GameClientConnection, avatarEntityId: AvatarEntityId) =>
    conn.tickUpdate$.pipe(
      filter(({ entityStates }) => !!entityStates[avatarEntityId]),
      map(({ tick, entityStates }) => ({ timing: tick, ...entityStates[avatarEntityId] })),
    ),
  deps: [GameClientConnection, AvatarEntityId],
}

function avatarEntityConditionalProvidersFactory({ isLocalClient }: AvatarData): AvatarEntityConditionalProviders {
  return isLocalClient
    ? [
        ControlledValidatedEntityTransformCalculation,
        ClientControlsManager.entityControlState$Provider,
        TickTimedEntityState$Provider,
      ]
    : [ReportedEntityTransformationCalculation, TickTimedEntityState$Provider]
}

export type AvatarProviders = [
  Provider<EntityId>,
  Provider<AvatarData>,
  Provider<AvatarEntityConditionalProviders>,
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
      provide: AvatarEntityConditionalProviders,
      useFactory: avatarEntityConditionalProvidersFactory,
      deps: [AvatarData],
    },
  ]
}

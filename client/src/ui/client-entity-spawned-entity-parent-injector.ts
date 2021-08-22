import { Injector, Provider } from '@dandi/core'
import { ClientConfig$, ClientScope } from '@mp-server/shared/client'
import { EntitySpawnTrigger, SpawnedEntityParentInjectorFn } from '@mp-server/shared/entity'
import { firstValueFrom } from 'rxjs'

import { ClientEntityData, ClientEntityScopeRequiredProviders, createClientEntityInjector } from './client-entity'
import { clientEntityConditionalProvidersFactory } from './client-entity-providers'

async function spawnedEntityParentInjectorFnFactory(
  clientConfig$: ClientConfig$,
): Promise<SpawnedEntityParentInjectorFn> {
  const clientConfig = await firstValueFrom(clientConfig$)
  return (injector: Injector, trigger: EntitySpawnTrigger) => {
    const { entityId } = trigger.entity
    const isLocalClient = clientConfig.clientId === entityId
    const requiredProviders: ClientEntityScopeRequiredProviders = {
      clientEntityData: {
        provide: ClientEntityData,
        useValue: {
          entityId,
          isLocalClient,
        },
      },
    }
    const conditionalProviders = clientEntityConditionalProvidersFactory(isLocalClient)
    return createClientEntityInjector(injector, { entityId }, requiredProviders, ...conditionalProviders)
  }
}

export const ClientEntitySpawnedEntityParentInjectorFnProvider: Provider<SpawnedEntityParentInjectorFn> = {
  provide: SpawnedEntityParentInjectorFn,
  useFactory: spawnedEntityParentInjectorFnFactory,
  deps: [ClientConfig$],
  async: true,
  restrictScope: ClientScope,
}

import { CustomInjectionScope, InjectionScope, InjectionToken, Injector, Provider } from '@dandi/core'

import { ScopeInstanceData, scopeInstanceFactory } from './create-scope-instance'

export type ScopeRequiredTokens<TProviderMap> = {
  [TKey in keyof TProviderMap]: TProviderMap[TKey] extends InjectionToken<unknown> ? TProviderMap[TKey] : never
}

export function scopeRequiredTokens<T>(providers: ScopeRequiredTokens<T>): ScopeRequiredTokens<T> {
  return providers
}

export type ScopeRequiredProviders<TTokenMap extends ScopeRequiredTokens<unknown>> = {
  [TKey in keyof TTokenMap & string as Uncapitalize<TKey>]: TTokenMap[TKey] extends InjectionToken<infer TToken>
    ? Provider<TToken>
    : never
}

export interface ScopeInjectorFactory<
  TScope extends CustomInjectionScope,
  TScopeInstance extends TScope,
  TRequiredTokens extends ScopeRequiredTokens<unknown>,
> {
  (
    parentInjector: Injector,
    instanceData: ScopeInstanceData<TScope, TScopeInstance>,
    requiredProviders?: ScopeRequiredProviders<TRequiredTokens>,
    ...additionalProviders: Provider<unknown>[]
  ): Injector
}

export function scopedInjectorFactory<
  TScope extends CustomInjectionScope,
  TScopeInstance extends TScope,
  TRequiredTokens extends ScopeRequiredTokens<unknown> = undefined,
>(baseScope: TScope): ScopeInjectorFactory<TScope, TScopeInstance, TRequiredTokens> {
  const scopeFactory = scopeInstanceFactory(baseScope)
  return (
    parentInjector: Injector,
    instanceData: ScopeInstanceData<TScope, TScopeInstance>,
    requiredProviders?: ScopeRequiredProviders<TRequiredTokens>,
    ...additionalProviders: Provider<unknown>[]
  ) => {
    const providers = Object.values(requiredProviders) as Provider<unknown>[]
    const scope = scopeFactory(instanceData)
    return parentInjector.createChild(scope, [
      ...providers,
      ...additionalProviders,
      {
        provide: InjectionScope,
        useValue: scope,
      },
    ])
  }
}

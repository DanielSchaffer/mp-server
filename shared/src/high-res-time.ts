import { Provider } from '@dandi/core'

import { localToken } from './local-token'

export interface HighResTimeProvider {
  (): bigint
}
export const HighResTimeProvider = localToken.opinionated<HighResTimeProvider>('HighResTimeProvider', {
  multi: false,
})

export function hiresTimeProvider(hires: HighResTimeProvider): Provider<HighResTimeProvider> {
  return {
    provide: HighResTimeProvider,
    useValue: hires,
  }
}

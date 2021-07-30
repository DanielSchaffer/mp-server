import { Provider } from '@dandi/core'
import { ChangedContainer, ClientId, ClientScope, ClientTransform, Point } from '@mp-server/shared'

import { localToken } from './local-token'

export interface AvatarData {
  clientId: ClientId
  isLocalClient: boolean
}

export const AvatarData = localToken.opinionated<AvatarData>('AvatarData', {
  multi: false,
  restrictScope: ClientScope,
})

export function avatarDataProvider(clientId: ClientId, isLocalClient: boolean): Provider<AvatarData> {
  return {
    provide: AvatarData,
    useValue: { clientId, isLocalClient },
  }
}

export interface Avatar extends ChangedContainer<ClientTransform, Point> {
  isLocalClient: boolean
  el: HTMLDivElement
}

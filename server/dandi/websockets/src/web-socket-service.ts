import { InjectionToken } from '@dandi/core'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface WebSocketService {
  run$: Observable<never>
  name: string
}

export const WebSocketService: InjectionToken<WebSocketService> = localToken.opinionated('WebSocketService', {
  multi: true,
})

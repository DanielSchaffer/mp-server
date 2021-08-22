import { EntityControlState } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface ClientInput {
  input$: Observable<EntityControlState>
}

export const ClientInput = localToken.opinionated<ClientInput>('ClientInput', {
  multi: true,
})

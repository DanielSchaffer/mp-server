import { ClientInputState } from '@mp-server/shared'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface ClientInput {
  input$: Observable<ClientInputState>
}

export const ClientInput = localToken.opinionated<ClientInput>('ClientInput', {
  multi: true,
})

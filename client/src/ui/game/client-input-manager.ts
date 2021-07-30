import { Inject, Injectable } from '@dandi/core'
import { keys } from '@mp-server/common'
import {
  ClientInputState, INITIAL_CLIENT_INPUT_STATE,
} from '@mp-server/shared'
import { distinctUntilChanged, merge, Observable, scan, share } from 'rxjs'

import { changes } from '@mp-server/common/rxjs'

import { ClientInput } from './client-input'

@Injectable()
export class ClientInputManager {
  
  public readonly input$: Observable<ClientInputState>
  
  constructor(
    @Inject(ClientInput) private readonly clientInputs: ClientInput[],
  ) {
    this.input$ = merge(...clientInputs.map(c => c.input$.pipe(changes()))).pipe(
      scan((result, changes) => {
        const changedKeys = keys(changes)
        if (changedKeys.length === 0) {
          return result
        }
        return changedKeys.reduce((result, key) => {
          return Object.assign({}, result, { [key]: changes[key]})
        }, result)
      }, INITIAL_CLIENT_INPUT_STATE),
      distinctUntilChanged(),
      share(),
    )
  }
}

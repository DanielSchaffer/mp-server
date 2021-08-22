import { Inject, Injectable } from '@dandi/core'
import { keys } from '@mp-server/common'
import { changes } from '@mp-server/common/rxjs'
import { EntityControlState, EntityControlState$, INITIAL_ENTITY_CONTROL_STATE } from '@mp-server/shared/entity'
import { distinctUntilChanged, merge, Observable, scan, shareReplay, startWith } from 'rxjs'

import { ClientInput } from './client-input'

@Injectable()
export class ClientControlsManager {
  public static readonly entityControlState$Provider = {
    provide: EntityControlState$,
    useFactory: (manager: ClientControlsManager) => manager.input$,
    deps: [ClientControlsManager],
  }

  public readonly input$: Observable<EntityControlState>

  constructor(@Inject(ClientInput) private readonly clientInputs: ClientInput[]) {
    this.input$ = merge(...clientInputs.map((c) => c.input$.pipe(changes()))).pipe(
      scan((result, changes) => {
        const changedKeys = keys(changes)
        if (changedKeys.length === 0) {
          return result
        }
        return changedKeys.reduce((result, key) => {
          return Object.assign({}, result, { [key]: changes[key] })
        }, result)
      }, INITIAL_ENTITY_CONTROL_STATE),
      startWith(INITIAL_ENTITY_CONTROL_STATE),
      distinctUntilChanged(),
      shareReplay(1),
    )
  }
}

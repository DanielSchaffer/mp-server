import { Inject, Injectable, Logger } from '@dandi/core'
import { ClientInputState, INITIAL_CLIENT_INPUT_STATE } from '@mp-server/shared'
import {
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  scan,
  share,
  shareReplay, tap,
} from 'rxjs'

import { ClientInput } from './client-input'

export type KeyMapping<TKey extends keyof ClientInputState> = [
  key: TKey,
  onValue: ClientInputState[TKey],
  offValue: ClientInputState[TKey],
]

export interface KeyMappings {
  [key: string]: KeyMapping<keyof ClientInputState>
}

const KEY_MAPPINGS: KeyMappings = {
  ArrowUp: ['forwardAcceleration', 1, 0],
  ArrowDown: ['backwardAcceleration', 1, 0],
  ArrowLeft: ['rotationLeft', 1, 0],
  ArrowRight: ['rotationRight', 1, 0],
  Space: ['fire', true, false],
}

@Injectable(ClientInput)
export class KeyboardInput implements ClientInput {

  public readonly input$: Observable<ClientInputState>

  constructor(
    @Inject(Document) private readonly document: Document,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.input$ = this.initInput()
  }

  protected initInput(): Observable<ClientInputState> {
    const interestedKeys = Object.keys(KEY_MAPPINGS)
    const filterInterestedKeys = filter((e: KeyboardEvent) => interestedKeys.includes(e.key))

    const keyDown$ = fromEvent<KeyboardEvent>(this.document, 'keydown').pipe(
      filterInterestedKeys,
      map(e => {
        const [key, onState] = KEY_MAPPINGS[e.key]
        return { key, state: onState }
      }),
      share(),
    )
    const keyUp$ = fromEvent<KeyboardEvent>(this.document, 'keyup').pipe(
      filterInterestedKeys,
      map(e => {
        const [key, onState, offState] = KEY_MAPPINGS[e.key]
        return { key, state: offState }
      }),
      share(),
    )

    return merge(keyUp$, keyDown$).pipe(
      scan((activeKeys, change) => {
        if (activeKeys[change.key] !== change.state) {
          return Object.assign({}, activeKeys, { [change.key]: change.state })
        }
        return activeKeys
      }, INITIAL_CLIENT_INPUT_STATE),
      distinctUntilChanged(),
      shareReplay(1),
    )

  }
}

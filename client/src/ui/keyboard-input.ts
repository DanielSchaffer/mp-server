import { Inject, Injectable, Logger } from '@dandi/core'
import { EntityControlState, INITIAL_ENTITY_CONTROL_STATE } from '@mp-server/shared/entity'
import {
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  scan,
  share,
  shareReplay,
  startWith,
} from 'rxjs'

import { ClientInput } from './client-input'

export type KeyMapping<TKey extends keyof EntityControlState> = [
  key: TKey,
  onValue: EntityControlState[TKey],
  offValue: EntityControlState[TKey],
]

export interface KeyMappings {
  [key: string]: KeyMapping<keyof EntityControlState>
}

const KEY_MAPPINGS: KeyMappings = {
  ArrowUp: ['forwardAcceleration', 1, 0],
  ArrowDown: ['backwardAcceleration', 1, 0],
  ArrowLeft: ['rotationLeft', 1, 0],
  ArrowRight: ['rotationRight', 1, 0],
  Space: ['fire', true, false],
  Alt: ['altFire', true, false],
}

@Injectable(ClientInput)
export class KeyboardInput implements ClientInput {
  public readonly input$: Observable<EntityControlState>

  constructor(
    @Inject(Document) private readonly document: Document,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.input$ = this.initInput()
  }

  protected initInput(): Observable<EntityControlState> {
    const interestedKeys = Object.keys(KEY_MAPPINGS)
    const filterInterestedKeys = filter((e: KeyboardEvent) => interestedKeys.includes(e.key))

    const keyDown$ = fromEvent<KeyboardEvent>(this.document, 'keydown').pipe(
      filterInterestedKeys,
      map((e) => {
        const [key, onState] = KEY_MAPPINGS[e.key]
        return {
          key,
          state: onState,
        }
      }),
      share(),
    )
    const keyUp$ = fromEvent<KeyboardEvent>(this.document, 'keyup').pipe(
      filterInterestedKeys,
      map((e) => {
        const [key, , offState] = KEY_MAPPINGS[e.key]
        return {
          key,
          state: offState,
        }
      }),
      share(),
    )

    return merge(keyUp$, keyDown$).pipe(
      scan((activeKeys, change) => {
        if (activeKeys[change.key] !== change.state) {
          return Object.assign({}, activeKeys, { [change.key]: change.state })
        }
        return activeKeys
      }, INITIAL_ENTITY_CONTROL_STATE),
      startWith(INITIAL_ENTITY_CONTROL_STATE),
      distinctUntilChanged(),
      shareReplay(1),
    )
  }
}

import { Inject, Injectable, Injector, Logger, RestrictScope } from '@dandi/core'
import { ClientId, ClientInputState, ClientScope, ClientTransformManager, createClientScope } from '@mp-server/shared'
import {
  from,
  map,
  mergeMap,
  Observable,
  shareReplay,
  withLatestFrom
} from 'rxjs'

import { Avatar, AvatarData, avatarDataProvider } from './avatar'
import { localToken } from './local-token'
import { GameDom } from '../game/game-dom'

export interface AvatarManager {
  readonly el$: Observable<HTMLDivElement>
  readonly avatar$: Observable<Avatar>
}

export interface ClientAvatarManagers {
  [clientId: string]: AvatarManager
}

export const AvatarManager = localToken.opinionated<AvatarManager>('AvatarManager', {
  multi: false,
  restrictScope: ClientScope,
})

export class AvatarManagerFacade implements AvatarManager {
  public static create(
    injector: Injector,
    clientId: ClientId,
    isLocalClient: boolean,
    clientInput$: Observable<ClientInputState>
  ): AvatarManager {
    const scope = createClientScope(clientId)
    const avatarInjector = injector.createChild(scope, [
      avatarDataProvider(clientId, isLocalClient),
      {
        provide: ClientInputState,
        useValue: clientInput$,
      }
    ])
    return new AvatarManagerFacade(from(avatarInjector.inject(AvatarManager)).pipe(shareReplay(1)))
  }

  public readonly el$: Observable<HTMLDivElement>
  public readonly avatar$: Observable<Avatar>

  protected constructor(protected readonly manager$: Observable<AvatarManager>) {
    this.el$ = manager$.pipe(
      mergeMap(manager => manager.el$),
      shareReplay(1),
    )
    this.avatar$ = manager$.pipe(
      mergeMap(manager => manager.avatar$),
      shareReplay(1),
    )
  }
}

@Injectable(AvatarManager, RestrictScope(ClientScope))
export class AvatarManagerImpl implements AvatarManager {

  public readonly el$: Observable<HTMLDivElement>
  public readonly avatar$: Observable<Avatar>
  public readonly isLocalClient: boolean

  constructor(
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(AvatarData) { clientId, isLocalClient }: AvatarData,
    @Inject(ClientTransformManager) protected readonly transformManager: ClientTransformManager,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    this.isLocalClient = isLocalClient

    const el$ = new Observable<HTMLDivElement>(o => {
      const el = document.createElement('div')
      el.setAttribute('class', 'avatar')
      el.setAttribute('id', `avatar-${clientId}`)
      dom.canvas.append(el)
      console.log('added avatar', el)
      o.next(el)
      return () => {
        console.log('removed avatar')
        el.remove()
      }
    }).pipe(
      shareReplay(1),
    )

    const avatar$ = transformManager.transform$.pipe(
      withLatestFrom(el$),
      map(([ state, el ]) => ({ el, isLocalClient, ...state })),
      shareReplay(1),
    )

    this.el$ = el$
    this.avatar$ = avatar$
  }

}

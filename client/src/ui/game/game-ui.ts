import { Inject, Injectable, Injector, Logger, RestrictScope } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { ClientConfig, Point, TickUpdate, TRANSFORM_CONFIG } from '@mp-server/shared'
import {
  combineLatest,
  filter,
  map, merge,
  mergeMap,
  Observable,
  of,
  pluck,
  scan,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs'

import { Avatar, AvatarManagerFacade, ClientAvatarManagers } from '../avatar'

import { ClientInputManager } from './client-input-manager'
import { DebugDisplay } from './debug-display'
import { GameScope } from './game'
import { GameDom } from './game-dom'

@Injectable(RestrictScope(GameScope))
export class GameUi {
  private readonly avatars$: Observable<ClientAvatarManagers>
  private readonly animate$: Observable<never>

  public readonly run$: Observable<never>

  constructor(
    @Inject(ClientConfig) protected readonly config$: Observable<ClientConfig>,
    @Inject(TickUpdate) protected readonly tickUpdate$: Observable<TickUpdate>,
    @Inject(ClientInputManager) protected readonly localClientInput: ClientInputManager,
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(Injector) protected readonly injector: Injector,
    @Inject(DebugDisplay) protected readonly debug: DebugDisplay,
    @Inject(Logger) protected readonly logger: Logger,
  ) {

    // this.localPlayerInput$ = combineLatest([this.config$, this.clientInputs$]).pipe(
    //   map(([{ clientId }, positions]) => positions[clientId]),
    //   filter(pos => !!pos),
    //   share(),
    // )
    const avatars$ = GameUi.initClientAvatars(this.injector, this.localClientInput, this.tickUpdate$, this.config$)
    const animate$ = GameUi.initAnimate(this.dom, avatars$)

    const localClientTransform$ = avatars$.pipe(
      withLatestFrom(this.config$),
      filter(([avatars, config]) => !!avatars[config.clientId]),
      switchMap(([avatars, config]) => avatars[config.clientId].avatar$),
    )

    this.avatars$ = avatars$
    this.animate$ = animate$
    this.run$ = merge(this.animate$, this.debug.bind(localClientTransform$))
  }

  protected static initClientAvatars(
    injector: Injector,
    localClientInput: ClientInputManager,
    tickUpdate$: Observable<TickUpdate>,
    config$: Observable<ClientConfig>,
  ): Observable<ClientAvatarManagers> {
    return tickUpdate$.pipe(
      withLatestFrom(config$),
      scan((avatars, [update, config]) => {
        update.addedClients.forEach(clientId => {
          const isLocalClient = clientId === config.clientId
          const clientInput$ = isLocalClient ? localClientInput.input$ : tickUpdate$.pipe(pluck('clientInputs', clientId))
          avatars[clientId] = AvatarManagerFacade.create(injector, clientId, isLocalClient, clientInput$)
        })

        update.removedClients.forEach(clientId => {
          delete avatars[clientId]
        })

        return avatars
      }, {} as ClientAvatarManagers),
      shareReplay(1),
    )
  }

  protected static initAnimate(dom: GameDom, avatarManagers$: Observable<ClientAvatarManagers>): Observable<never> {
    const avatars$ = avatarManagers$.pipe(
      mergeMap(managers => {
        const clientIds$ = of(Object.keys(managers))
        const avatars$ = combineLatest(Object.values(managers).map(manager => manager.avatar$))
        return combineLatest([clientIds$, avatars$])
      }),
      map(([clientIds, avatars]) => {
        return clientIds.reduce((result, clientId, index) => {
          result[clientId] = avatars[index]
          return result
        }, {} as { [clientId: string]: Avatar })
      }),
    )
    return avatars$.pipe(
      withLatestFrom(dom.viewportSize$),
      tap(([avatars, viewportSize]) => {
        Object.values(avatars).forEach(avatar => this.updatePosition(dom, avatar, viewportSize))
      }),
      silence(),
    )
  }

  public static updatePosition(dom: GameDom, avatar: Avatar, viewportSize: DOMRect) {
    if (avatar.isLocalClient) {
      const isInit = dom.init()
      if (isInit || avatar.position.location.changed || avatar.movement.velocity.changed) {
        const total = Point.absTotal(avatar.movement.velocity)
        const mid = TRANSFORM_CONFIG.maxVelocity / 2
        const zoomFactor = (TRANSFORM_CONFIG.maxVelocity - total) / TRANSFORM_CONFIG.maxVelocity
        const zoom = zoomFactor + 0.55
        // const zoom = zoomFactor
        // dom.stage.style.transformOrigin = `${avatar.position.location.x}px ${avatar.position.location.y}px`
        // this.applyTransform(dom.stage, `translate(${-avatar.position.location.x}px, ${-avatar.position.location.y}px) scale(${zoom},${zoom})`)
        this.applyTransform(dom.stage, `translate(${-avatar.position.location.x + viewportSize.width / 2}px, ${-avatar.position.location.y + viewportSize.height / 2}px)`)
      }
    }
    if (avatar.position.location.changed || avatar.position.orientation.changed) {
      this.applyTransform(avatar.el, `translate(${avatar.position.location.x}px, ${avatar.position.location.y}px) rotate(${avatar.position.orientation.y}deg)`)
    }
  }

  public static applyTransform(el: HTMLDivElement, transform: string): void {
    el.style.transform = transform
  }
}

import { Inject, Injectable, Injector, Logger, RestrictScope } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import {
  createEntityInjector,
  Entity,
  EntityScope,
  EntityScopeData,
  EntityTransformManager,
} from '@mp-server/shared/entity'
import { from, map, Observable, shareReplay, takeUntil, tap, withLatestFrom } from 'rxjs'

import { GameDom } from '../game/game-dom'

import { Avatar, AvatarData, AvatarEntityId, createAvatarScope } from './avatar'
import { avatarEntityProviders } from './avatar-entity-providers'
import { avatarProviders } from './avatar-providers'

export interface AvatarManager {
  readonly el$: Observable<HTMLDivElement>
  readonly avatar$: Observable<Avatar>
  readonly animate$: Observable<never>
  readonly destroy$: Observable<unknown>

  readonly avatarEntityId: AvatarEntityId
}

// export const AvatarManager = localToken.opinionated<AvatarManager>('AvatarManager', {
//   multi: false,
//   restrictScope: EntityScope,
// })

export function avatarManagerFactory(
  injector: Injector,
  { entityId, entityDefKey }: EntityScopeData,
): Observable<AvatarManager> {
  const avatarEntityId = entityId
  const avatarScope = createAvatarScope({ avatarEntityId })
  const avatarInjector = injector.createChild(avatarScope, avatarProviders(avatarEntityId))
  const avatarEntityInjector = createEntityInjector(
    avatarInjector,
    {
      entityId: avatarEntityId,
      entityDefKey,
    },
    avatarEntityProviders(avatarEntityId, entityDefKey),
  )
  return from(avatarEntityInjector.inject(AvatarManagerImpl) as Promise<AvatarManager>).pipe(shareReplay(1))
}

/**
 * @internal
 */
@Injectable(RestrictScope(EntityScope))
export class AvatarManagerImpl implements AvatarManager {
  public readonly el$: Observable<HTMLDivElement>
  public readonly avatar$: Observable<Avatar>
  public readonly destroy$: Observable<unknown>
  public readonly animate$: Observable<never>

  public readonly isLocalClient: boolean
  public readonly avatarEntityId: AvatarEntityId

  protected static initElement(dom: GameDom, entity: Entity, avatarData: AvatarData): Observable<HTMLDivElement> {
    return new Observable<HTMLDivElement>((o) => {
      const el = document.createElement('div')
      el.setAttribute('class', 'avatar')
      el.setAttribute('id', `avatar-${avatarData.avatarEntityId}`)
      dom.stage.append(el)
      console.log('added avatar', el)
      o.next(el)
      return () => {
        console.log('removed avatar')
        el.remove()
      }
    }).pipe(takeUntil(entity.destroy$), shareReplay(1))
  }

  protected static initAvatar(
    transformManager: EntityTransformManager,
    el$: Observable<HTMLDivElement>,
    { avatarEntityId, isLocalClient }: AvatarData,
  ): Observable<Avatar> {
    return transformManager.transform$.pipe(
      withLatestFrom(el$),
      map(([state, el]) => ({
        avatarEntityId,
        el,
        isLocalClient,
        ...state,
      })),
      shareReplay(1),
    )
  }

  protected static initAnimate(dom: GameDom, avatar$: Observable<Avatar>): Observable<never> {
    return avatar$.pipe(
      withLatestFrom(dom.viewportSize$),
      tap(([avatar, viewportSize]) => this.updatePosition(dom, avatar, viewportSize)),
      silence(),
    )
  }

  protected static updatePosition(dom: GameDom, avatar: Avatar, viewportSize: DOMRect): void {
    const { location, orientation } = avatar.transform.position
    const { velocity } = avatar.transform.movement
    if (avatar.isLocalClient) {
      const isInit = dom.init()
      if (isInit || location.changed || velocity.changed) {
        // const total = Point.absTotal(avatar.movement.velocity)
        // const mid = TRANSFORM_CONFIG.maxVelocity / 2
        // const zoomFactor = (TRANSFORM_CONFIG.maxVelocity - total) / TRANSFORM_CONFIG.maxVelocity
        // const zoom = zoomFactor + 0.55
        // const zoom = zoomFactor
        // dom.stage.style.transformOrigin = `${avatar.position.location.x}px ${avatar.position.location.y}px`
        // this.applyTransform(dom.stage, `translate(${-avatar.position.location.x}px, ${-avatar.position.location.y}px) scale(${zoom},${zoom})`)
        this.applyTransform(
          dom.stage,
          `translate(${-location.x + viewportSize.width / 2}px, ${-location.y + viewportSize.height / 2}px)`,
        )
      }
    }
    if (location.changed || orientation.changed) {
      this.applyTransform(avatar.el, `translate(${location.x}px, ${location.y}px) rotate(${orientation.y}deg)`)
    }
  }

  protected static applyTransform(el: HTMLDivElement, transform: string): void {
    el.style.transform = transform
  }

  constructor(
    @Inject(Entity) protected readonly entity: Entity,
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(AvatarData) protected readonly avatarData: AvatarData,
    @Inject(EntityTransformManager) protected readonly transformManager: EntityTransformManager,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const el$ = AvatarManagerImpl.initElement(dom, entity, avatarData)
    const avatar$ = AvatarManagerImpl.initAvatar(transformManager, el$, avatarData)
    const animate$ = AvatarManagerImpl.initAnimate(dom, avatar$)

    this.isLocalClient = avatarData.isLocalClient
    this.avatarEntityId = avatarData.avatarEntityId
    this.destroy$ = entity.destroy$

    this.el$ = el$
    this.avatar$ = avatar$
    this.animate$ = animate$
  }
}

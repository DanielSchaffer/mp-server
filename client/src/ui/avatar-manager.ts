import { Inject, Injectable, Logger } from '@dandi/core'
import { fromInjection } from '@dandi/rxjs'
import { silence } from '@mp-server/common/rxjs'
import {
  EntityId,
  EntityScope,
  EntityTransformManager,
  SpawnedEntity,
  SpawnedEntity$,
} from '@mp-server/shared/entity'
import { map, mergeMap, Observable, shareReplay, takeUntil, tap, withLatestFrom } from 'rxjs'

import { Avatar } from './avatar'
import { ClientEntityData } from './client-entity'
import { GameDom } from './game-dom'
import { localToken } from './local-token'

export interface AvatarManager {
  readonly el$: Observable<HTMLDivElement>
  readonly avatar$: Observable<Avatar>
  readonly animate$: Observable<never>

  readonly entityId: EntityId
  readonly isLocalClient: boolean
}

export const AvatarManager = localToken.opinionated<AvatarManager>('AvatarManager', {
  multi: false,
  restrictScope: EntityScope,
})

export function avatarManagerFactory(entity: SpawnedEntity): Observable<AvatarManager> {
  return fromInjection(
    entity.injector,
    AvatarManager,
    false,
    entity.despawn$.pipe(map((entity) => `${entity.entityDefKey} entity despawn (${entity.entityId})`)),
  ).pipe(shareReplay(1))
}

/**
 * @internal
 */
@Injectable(AvatarManager)
export class AvatarManagerImpl implements AvatarManager {
  public readonly el$: Observable<HTMLDivElement>
  public readonly avatar$: Observable<Avatar>
  public readonly animate$: Observable<never>

  public readonly isLocalClient: boolean
  public readonly entityId: EntityId

  protected static initElement(
    dom: GameDom,
    entity$: Observable<SpawnedEntity>,
    clientEntityData: ClientEntityData,
  ): Observable<HTMLDivElement> {
    return entity$.pipe(
      mergeMap((entity) =>
        new Observable<HTMLDivElement>((o) => {
          const el = document.createElement('div')
          const cssClasses = ['entity', `entity--${entity.def.key}`]
          if (clientEntityData.isLocalClient) {
            cssClasses.push('entity--local')
          }
          el.setAttribute('class', cssClasses.join(' '))
          el.setAttribute('id', `entity-${entity.entityId}`)
          dom.stage.append(el)
          console.log('added avatar', el)
          o.next(el)
          return () => {
            console.log('removed avatar')
            el.remove()
          }
        }).pipe(takeUntil(entity.despawn$)),
      ),
      shareReplay(1),
    )
  }

  protected static initAvatar(
    transformManager: EntityTransformManager,
    el$: Observable<HTMLDivElement>,
    { entityId, isLocalClient }: ClientEntityData,
  ): Observable<Avatar> {
    return transformManager.transform$.pipe(
      withLatestFrom(el$),
      map(([state, el]) => ({
        entityId,
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
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(SpawnedEntity$) protected entity$: SpawnedEntity$,
    @Inject(ClientEntityData) protected readonly avatarData: ClientEntityData,
    @Inject(EntityTransformManager) protected readonly transformManager: EntityTransformManager,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const el$ = AvatarManagerImpl.initElement(dom, entity$, avatarData)
    const avatar$ = AvatarManagerImpl.initAvatar(transformManager, el$, avatarData)
    const animate$ = AvatarManagerImpl.initAnimate(dom, avatar$)

    this.isLocalClient = avatarData.isLocalClient
    this.entityId = avatarData.entityId

    this.el$ = el$
    this.avatar$ = avatar$
    this.animate$ = animate$
  }
}

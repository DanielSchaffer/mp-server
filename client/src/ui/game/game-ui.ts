import { Inject, Injectable, Injector, Logger, RestrictScope } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { ClientConfig$, ClientControlStateChange, ClientMessageType, ClientScope } from '@mp-server/shared/client'
import { EntityControlState$ } from '@mp-server/shared/entity'
import { TickUpdate$ } from '@mp-server/shared/server'
import { filter, from, map, merge, mergeMap, Observable, share, switchMap, take, withLatestFrom } from 'rxjs'

import { GameClientConnection } from '../../game-client-connection'

import { AvatarManager, avatarManagerFactory } from '../avatar'

import { ClientControlsManager } from './client-controls-manager'
import { DebugDisplay } from './debug-display'
import { GameDom } from './game-dom'

@Injectable(RestrictScope(ClientScope))
export class GameUi {
  public readonly run$: Observable<never>
  public readonly localInput$: EntityControlState$
  public readonly localInputUpdate$: Observable<void>
  private readonly avatar$: Observable<AvatarManager>
  private readonly animate$: Observable<never>

  protected static initAvatars(injector: Injector, conn: GameClientConnection): Observable<AvatarManager> {
    const viaInitialEntities$ = conn.config$.pipe(
      take(1),
      switchMap((config) => from(config.initialEntities)),
    )
    const viaAddEntity$ = conn.addEntity$.pipe(
      map(({ entityId, entityProfile }) => ({
        entityId,
        entityDefKey: entityProfile.entityDefKey,
      })),
    )
    const createAvatarManager = avatarManagerFactory.bind(undefined, injector)
    return merge(viaInitialEntities$, viaAddEntity$).pipe(mergeMap(createAvatarManager), share())
  }

  constructor(
    @Inject(GameClientConnection) protected readonly conn: GameClientConnection,
    @Inject(ClientConfig$) protected readonly config$: ClientConfig$,
    @Inject(TickUpdate$) protected readonly tickUpdate$: TickUpdate$,
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(ClientControlsManager) protected readonly localClientInput: ClientControlsManager,
    @Inject(Injector) protected readonly injector: Injector,
    @Inject(DebugDisplay) protected readonly debug: DebugDisplay,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const avatar$ = GameUi.initAvatars(this.injector, conn)

    const localInput$ = localClientInput.input$
    const localInputUpdate$ = localInput$.pipe(
      map(
        (controlState): ClientControlStateChange => ({
          type: ClientMessageType.inputStateChange,
          controlState,
        }),
      ),
      mergeMap((update) => conn.send(update)),
      share(),
    )

    const localClientTransform$ = avatar$.pipe(
      withLatestFrom(this.config$),
      filter(([avatar, config]) => avatar.avatarEntityId === config.clientId),
      switchMap(([avatar]) => avatar.avatar$),
    )

    const animate$ = avatar$.pipe(mergeMap((avatar) => avatar.animate$))

    this.avatar$ = avatar$
    this.animate$ = animate$
    this.localInput$ = localInput$
    this.localInputUpdate$ = localInputUpdate$
    this.run$ = merge(
      this.animate$,
      this.localInput$,
      this.localInputUpdate$,
      this.debug.bind(localClientTransform$),
    ).pipe(silence())
  }
}

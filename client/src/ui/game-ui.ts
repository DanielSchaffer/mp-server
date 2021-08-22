import { Inject, Injectable, Logger, RestrictScope } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import { ClientConfig$, ClientControlStateChange, ClientMessageType, ClientScope } from '@mp-server/shared/client'
import { EntityControlState$, SpawnedEntities$ } from '@mp-server/shared/entity'
import { filter, map, merge, mergeMap, Observable, share, switchMap, withLatestFrom } from 'rxjs'

import { AvatarManager, avatarManagerFactory } from './avatar-manager'
import { ClientControlsManager } from './client-controls-manager'
import { DebugDisplay } from './debug-display'
import { GameClientConnection } from './game-client-connection'
import { GameDom } from './game-dom'

@Injectable(RestrictScope(ClientScope))
export class GameUi {
  public readonly run$: Observable<never>
  public readonly localInput$: EntityControlState$
  public readonly localInputUpdate$: Observable<void>
  private readonly avatar$: Observable<AvatarManager>
  private readonly animate$: Observable<never>

  protected static initAvatars(entities$: SpawnedEntities$): Observable<AvatarManager> {
    return entities$.pipe(mergeMap(avatarManagerFactory), share())
  }

  constructor(
    @Inject(GameDom) protected readonly dom: GameDom,
    @Inject(GameClientConnection) protected readonly conn: GameClientConnection,
    @Inject(ClientConfig$) protected readonly config$: ClientConfig$,
    @Inject(SpawnedEntities$) protected readonly entities$: SpawnedEntities$,
    @Inject(ClientControlsManager) protected readonly localClientInput: ClientControlsManager,
    @Inject(DebugDisplay) protected readonly debug: DebugDisplay,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    const avatar$ = GameUi.initAvatars(entities$)

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
      filter(([avatar, config]) => avatar.entityId === config.clientId),
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

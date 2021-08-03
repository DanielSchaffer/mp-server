import { defineScope, scopeInstanceFactory } from '@mp-server/common/dandi'
import { TickTiming } from '@mp-server/shared'
import { TimedEntityState } from '@mp-server/shared/entity'
import { Observable } from 'rxjs'

import { localToken } from './local-token'

export interface PlayerScopeData {
  playerId: string
}

export type PlayerId = PlayerScopeData['playerId']

export interface Player<
  TTiming extends TickTiming = TickTiming,
  TState extends TimedEntityState<TTiming> = TimedEntityState<TTiming>,
  TDisconnect = unknown,
> extends PlayerScopeData {
  state$: Observable<TState>
  disconnect$: Observable<TDisconnect>
}

const PLAYER_SCOPE = `${localToken.PKG}#Player`

export const PlayerScope = defineScope(PLAYER_SCOPE)
export type PlayerScope = typeof PlayerScope

export interface PlayerScopeInstance extends PlayerScope, PlayerScopeData {}

export const createPlayerScope = scopeInstanceFactory<PlayerScope, PlayerScopeInstance>(PlayerScope)

export const Player = localToken.opinionated<Player>('Player', {
  multi: false,
  restrictScope: PlayerScope,
})

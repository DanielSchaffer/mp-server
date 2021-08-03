import { ChangedContainer, Point, SubtickTiming, TickTiming } from '@mp-server/shared'
import { Observable } from 'rxjs'

import { EntityScope } from './entity'
import { EntityControlState } from './entity-control-state'
import { EntityTransform } from './entity-transform'
import { localToken } from './local-token'

export interface EntityState {
  control: EntityControlState
  transform: ChangedContainer<EntityTransform, Point>
}

export type EntityStateMap = {
  // TODO: switch to symbol once TypeScript 4.4 is available
  [entityId: string]: EntityState
}

export interface TimedEntityState<TTiming extends TickTiming> extends EntityState {
  timing: TTiming
}

export type TickTimedEntityState = TimedEntityState<TickTiming>

export type TickTimedEntityState$ = Observable<TickTimedEntityState>
export const TickTimedEntityState$ = localToken.opinionated<TickTimedEntityState$>('TickTimedEntityState$', {
  multi: false,
  restrictScope: EntityScope,
})

export interface TimedEntityStateTracking<TTiming extends TickTiming>
  extends Omit<TimedEntityState<TTiming>, 'transform'> {
  lastTickTransform: ChangedContainer<EntityTransform, Point>
}

export type SubtickTimedEntityStateTracking = TimedEntityStateTracking<SubtickTiming>

export type TrackedTimedEntityState<TTiming extends TickTiming> = TimedEntityState<TTiming> &
  TimedEntityStateTracking<TTiming>

export type TrackedSubtickTimedEntityState = TrackedTimedEntityState<SubtickTiming>

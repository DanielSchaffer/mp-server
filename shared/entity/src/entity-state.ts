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
export type SubtickTimedEntityState = TimedEntityState<SubtickTiming>

export interface EntityStateReport {
  transform: ChangedContainer<EntityTransform, Point>
  timing: TickTiming
}

export type TickTimedEntityState$ = Observable<TickTimedEntityState>
export const TickTimedEntityState$ = localToken.opinionated<TickTimedEntityState$>('TickTimedEntityState$', {
  multi: false,
  restrictScope: EntityScope,
})

export interface TimedEntityStateReporting<TTiming extends TickTiming>
  extends Omit<TimedEntityState<TTiming>, 'transform'> {
  report: EntityStateReport
}

export type ReportedSubtickTimedEntityStateTracking = TimedEntityStateReporting<SubtickTiming>

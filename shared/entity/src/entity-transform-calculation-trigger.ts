import { Provider } from '@dandi/core'
import { hasOwnProperty } from '@mp-server/common'
import { SubtickTiming, SubtickTiming$ } from '@mp-server/shared'
import { filter, map, Observable, withLatestFrom } from 'rxjs'
import { share } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState, EntityControlState$ } from './entity-control-state'
import { ReportedSubtickTimedEntityStateTracking, TickTimedEntityState$ } from './entity-state'
import { localToken } from './local-token'

/**
 * Represents data available for a locally controlled entity, like the local player
 */
export interface ControlledEntityTransformCalculationData {
  control: EntityControlState
  timing: SubtickTiming
}

/**
 * Represents data available for a remotely controlled entity, such a remote player or NPC
 */
export type ReportedEntityTransformCalculationData = ReportedSubtickTimedEntityStateTracking &
  ControlledEntityTransformCalculationData

export type EntityTransformCalculationData =
  | ControlledEntityTransformCalculationData
  | ReportedEntityTransformCalculationData

export function isReportedTransformTrigger(
  obj: EntityTransformCalculationData,
): obj is ReportedEntityTransformCalculationData {
  return hasOwnProperty(obj, 'report')
}

export type EntityTransformCalculationTrigger$ = Observable<EntityTransformCalculationData>
export const EntityTransformCalculationTrigger$ = localToken.opinionated<EntityTransformCalculationTrigger$>(
  'EntityTransformCalculationTrigger$',
  {
    multi: false,
    restrictScope: EntityScope,
  },
)

export const ControlledEntityTransformCalculation: Provider<EntityTransformCalculationTrigger$> = {
  provide: EntityTransformCalculationTrigger$,
  useFactory(
    controlState$: Observable<EntityControlState>,
    subtick$: Observable<SubtickTiming>,
  ): Observable<ControlledEntityTransformCalculationData> {
    return subtick$.pipe(
      withLatestFrom(controlState$),
      map(([timing, control]) => ({
        control,
        timing,
      })),
      share(),
    )
  },
  deps: [EntityControlState$, SubtickTiming$],
}

export const ControlledValidatedEntityTransformCalculation: Provider<EntityTransformCalculationTrigger$> = {
  provide: EntityTransformCalculationTrigger$,
  useFactory(
    controlState$: Observable<EntityControlState>,
    subtick$: Observable<SubtickTiming>,
    entityState$: TickTimedEntityState$,
  ) {
    return subtick$.pipe(
      withLatestFrom(controlState$, entityState$),
      map(([timing, control, entityState]): EntityTransformCalculationData => {
        const report = {
          timing,
          transform: entityState.transform,
        }
        return {
          control,
          timing,
          report,
        }
      }),
      share(),
    )
  },
  deps: [EntityControlState$, SubtickTiming$, TickTimedEntityState$],
}

export const ReportedEntityTransformationCalculation: Provider<EntityTransformCalculationTrigger$> = {
  provide: EntityTransformCalculationTrigger$,
  useFactory(
    subtick$: Observable<SubtickTiming>,
    entityState$: TickTimedEntityState$,
  ): Observable<ReportedEntityTransformCalculationData> {
    return subtick$.pipe(
      withLatestFrom(entityState$),
      filter(([, tickTransform]) => !!tickTransform),
      map(([timing, state]) => {
        const { control, transform } = state
        if (!control || !transform || !timing) {
          debugger
        }
        const report = {
          timing,
          transform,
        }
        return {
          report,
          control,
          timing,
        }
      }),
      share(),
    )
  },
  deps: [SubtickTiming$, TickTimedEntityState$],
}

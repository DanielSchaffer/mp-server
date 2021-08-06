import { Provider } from '@dandi/core'
import { hasOwnProperty } from '@mp-server/common'
import { SubtickTiming, SubtickTiming$ } from '@mp-server/shared'
import {
  EntityControlState,
  EntityControlState$,
  EntityScope,
  SubtickTimedEntityStateTracking,
  TickTimedEntityState$,
} from '@mp-server/shared/entity'
import { filter, map, Observable, withLatestFrom } from 'rxjs'
import { share } from 'rxjs/operators'

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
export type ReportedEntityTransformCalculationData = SubtickTimedEntityStateTracking &
  ControlledEntityTransformCalculationData

export type EntityTransformCalculationData =
  | ControlledEntityTransformCalculationData
  | ReportedEntityTransformCalculationData

export function isReportedTransformTrigger(
  obj: EntityTransformCalculationData,
): obj is ReportedEntityTransformCalculationData {
  return hasOwnProperty(obj, 'lastTickTransform')
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
      map(([timing, control]) => {
        return {
          control,
          timing,
        }
      }),
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
      map(([timing, control, entityState]) => {
        return {
          lastTickTransform: entityState.transform,
          control,
          timing,
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
        return {
          lastTickTransform: transform,
          control,
          timing,
        }
      }),
      // map(([timing, { control, transform }]) => ({
      //   lastTickTransform: transform,
      //   control,
      //   timing,
      // })),
      share(),
    )
  },
  deps: [SubtickTiming$, TickTimedEntityState$],
}

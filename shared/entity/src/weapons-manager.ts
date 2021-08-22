import { Inject, Injectable, Logger, RestrictScope } from '@dandi/core'
import {
  defer,
  distinctUntilChanged,
  mapTo,
  merge,
  mergeMapTo,
  NEVER,
  Observable,
  pluck,
  startWith,
  takeUntil,
  timer,
} from 'rxjs'
import { filter, share } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState, EntityControlState$ } from './entity-control-state'
import { EntityDef, isArmedEntity, WeaponConfig } from './entity-def'
import { EntityDefRegistry } from './entity-def-registry'

function invalidWeapon(def: EntityDef, logger: Logger): Observable<never> {
  return defer(() => {
    logger.warn(`Weapon projectile EntityDef '${def.key}' is not supported`)
    return NEVER
  }).pipe(share())
}

@Injectable(RestrictScope(EntityScope))
export class WeaponsManager {
  public readonly fire$: Observable<EntityDef>

  // public readonly altFire$: Observable<EntityDef>

  protected static initStream(
    defs: EntityDefRegistry,
    config: WeaponConfig,
    controlState$: EntityControlState$,
    fireKey: keyof Pick<EntityControlState, 'fire' | 'altFire'>,
    logger: Logger,
  ): Observable<EntityDef> {
    if (!defs.has(config.entityDef.key)) {
      return invalidWeapon(config.entityDef, logger)
    }
    const fireControl$ = controlState$.pipe(pluck(fireKey), startWith(false), distinctUntilChanged(), share())
    const fireOn$ = fireControl$.pipe(
      filter((fire) => !!fire),
      share(),
    )
    const fireOff$ = fireControl$.pipe(
      filter((fire) => !fire),
      share(),
    )
    return fireOn$.pipe(
      mergeMapTo(timer(0, config.fireRate).pipe(takeUntil(fireOff$))),
      mapTo(config.entityDef),
      share(),
    )
  }

  constructor(
    @Inject(EntityControlState$) protected readonly controlState$: EntityControlState$,
    @Inject(EntityDef) protected readonly entityDef: EntityDef,
    @Inject(EntityDefRegistry) protected readonly entityDefs: EntityDefRegistry,
    @Inject(Logger) protected readonly logger: Logger,
  ) {
    if (isArmedEntity(entityDef)) {
      const fire$ = WeaponsManager.initStream(entityDefs, entityDef.primaryWeapon, controlState$, 'fire', logger)
      const altFire$ = WeaponsManager.initStream(
        entityDefs,
        entityDef.secondaryWeapon,
        controlState$,
        'altFire',
        logger,
      )

      this.fire$ = merge(fire$, altFire$).pipe(share())
    } else {
      this.fire$ = NEVER
    }
  }
}

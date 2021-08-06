import { Inject, Injectable, RestrictScope } from '@dandi/core'
import { StaticProjectile } from '@mp-server/shared/entities'
import { distinctUntilChanged, mapTo, mergeMapTo, Observable, pluck, startWith, takeUntil, timer } from 'rxjs'
import { filter, share } from 'rxjs/operators'

import { EntityScope } from './entity'
import { EntityControlState, EntityControlState$ } from './entity-control-state'
import { EntityDef } from './entity-def'

export interface WeaponConfig {
  fireRate: number
  entityDef: EntityDef
}

const DEFAULT_WEAPON_CONFIG = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  fireRate: 1000,
  entityDef: StaticProjectile,
}

const DEFAULT_ALT_WEAPON_CONFIG = {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  fireRate: 2500,
  entityDef: StaticProjectile,
}

@Injectable(RestrictScope(EntityScope))
export class WeaponsManager {
  public readonly fire$: Observable<EntityDef>
  public readonly altFire$: Observable<EntityDef>

  protected static initStream(
    config: WeaponConfig,
    controlState$: EntityControlState$,
    fireKey: keyof Pick<EntityControlState, 'fire' | 'altFire'>,
  ): Observable<EntityDef> {
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

  constructor(@Inject(EntityControlState$) protected readonly controlState$: EntityControlState$) {
    this.fire$ = WeaponsManager.initStream(DEFAULT_WEAPON_CONFIG, controlState$, 'fire')
    this.altFire$ = WeaponsManager.initStream(DEFAULT_ALT_WEAPON_CONFIG, controlState$, 'altFire')
  }
}

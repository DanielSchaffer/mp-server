import { EntityState } from '@mp-server/shared/entity'

import { ClientEntityData } from './client-entity'

export interface Avatar extends ClientEntityData, EntityState {
  el: HTMLDivElement
}

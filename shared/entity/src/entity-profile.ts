import { EntityScope } from './entity'
import { localToken } from './local-token'

export interface EntityProfile {
  entityDefKey: string
}

export const EntityProfile = localToken.opinionated<EntityProfile>('EntityProfile', {
  multi: false,
  restrictScope: EntityScope,
})

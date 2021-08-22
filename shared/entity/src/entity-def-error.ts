import { DandiApplicationError } from '@dandi/core'

import { EntityDef } from './entity-def'

export class EntityDefError extends DandiApplicationError {
  constructor(
    message: string,
    public readonly entityDefKey: string,
    public readonly entityDef?: EntityDef,
    innerError?: Error,
  ) {
    super(message, innerError)
  }
}

export class DuplicateEntityDefEntryError extends EntityDefError {
  constructor(entityDefKey: string, entityDef: EntityDef, innerError?: Error) {
    super(`Duplicate EntityDef for key '${entityDefKey}'`, entityDefKey, entityDef, innerError)
  }
}

export class MissingEntityDefError extends EntityDefError {
  constructor(entityDefKey: string, innerError?: Error) {
    super(`Missing EntityDef entry for key '${entityDefKey}'`, entityDefKey, undefined, innerError)
  }
}

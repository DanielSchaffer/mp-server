import { Provider } from '@dandi/core'
import { Client } from '@mp-server/shared/client'
import { EntityTransformManager } from '@mp-server/shared/entity'
import { Player } from '@mp-server/shared/player'

export type ServerPlayer = Player

function serverPlayerFactory(client: Client, { transform$ }: EntityTransformManager): Player {
  return {
    playerId: client.clientId,
    disconnect$: client.disconnect$,
    state$: transform$,
  }
}

export function serverPlayerProvider(): Provider<Player> {
  return {
    provide: Player,
    useFactory: serverPlayerFactory,
    deps: [Client, EntityTransformManager],
  }
}

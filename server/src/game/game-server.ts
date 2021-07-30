import { Inject, Injectable, Logger } from '@dandi/core'
import { silence } from '@mp-server/common/rxjs'
import {
  ClientInputStateChange,
  ClientMessage,
  ClientMessageType,
  ClientMessageUpdate,
  INITIAL_CLIENT_INPUT_STATE, json,
  ServerMessageType,
  TickTiming,
  TickUpdateMessage,
} from '@mp-server/shared'
import {
  buffer,
  merge,
  Observable,
} from 'rxjs'
import { filter, map, mapTo, mergeMap, scan, share, take, tap, withLatestFrom } from 'rxjs/operators'

import { WebSocketServer, WebSocketService } from '../../dandi/websockets'

import { ClientConnection } from './client-connection'
import { GameServerConfig } from './game-server-config'

export type ClientTickMessage<TMessage extends ClientMessage = ClientMessage> = [TMessage, TickTiming]

@Injectable(WebSocketService)
export class GameServer implements WebSocketService {
  public readonly name = 'GameServer'

  public readonly run$: Observable<never>

  constructor(
    @Inject(GameServerConfig) public readonly config: GameServerConfig,
    @Inject(WebSocketServer) private readonly server: WebSocketServer,
    @Inject(TickTiming) public readonly tick$: Observable<TickTiming>,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const clientInputs$ = this.server.connection$.pipe(
      mergeMap(conn => ClientConnection.register(this.config, conn)),
      mergeMap(conn => {
        const inputStateUpdateMessage$: Observable<ClientInputStateChange> = conn.message$.pipe(
          filter(function(msg: ClientMessage): msg is ClientInputStateChange {
            return msg.type === ClientMessageType.inputStateChange
          }),
        )
        const initialInputState: ClientInputStateChange = {
          type: ClientMessageType.inputStateChange,
          inputState: INITIAL_CLIENT_INPUT_STATE
        }
        const initialInputState$ = this.tick$.pipe(
          map(tick => ([initialInputState, tick] as const)),
          take(1),
        )
        const clientInputState$: Observable<ClientTickMessage<ClientInputStateChange>> = inputStateUpdateMessage$.pipe(
          withLatestFrom(this.tick$),
        )
        const close$: Observable<ClientTickMessage> = conn.close$.pipe(
          mapTo({ type: ClientMessageType.disconnect as const }),
          withLatestFrom(this.tick$),
        )
        return merge(close$, initialInputState$, clientInputState$).pipe(
          map(([msg, tick]) => [conn, msg, tick] as const),
        )
      }),
      scan(({ inputStates }, [conn, msg]) => {
        const id = conn.clientId
        if (msg.type === ClientMessageType.disconnect) {
          delete inputStates[id]
          return { removedClient: id, inputStates }
        }
        if (msg.type === ClientMessageType.inputStateChange) {
          const isNew = !inputStates[id]
          Object.assign(inputStates, { [id]: msg.inputState })
          if (isNew) {
            return { addedClient: id, inputStates }
          }
        }
        return { inputStates }
      }, { inputStates: {} } as ClientMessageUpdate),
      share(),
    )

    const update$ = clientInputs$.pipe(
      buffer(this.tick$),
      withLatestFrom(this.server.server$, this.tick$),
      tap(([updates, server, tick]) => {
        const tickUpdate: TickUpdateMessage = updates.reduce((result, update) => {
          result.clientInputs = update.inputStates
          if (update.addedClient) {
            result.addedClients.push(update.addedClient)
          }
          if (update.removedClient) {
            result.removedClients.push(update.removedClient)
          }
          return result
        }, { type: ServerMessageType.tick, tick, addedClients: [], removedClients: [], clientInputs: {} })

        server.clients.forEach(client => {
          client.send(json.stringify(tickUpdate))
        })
      })
    )

    this.run$ = update$.pipe(silence())
  }

}

import { NODE_ENV } from '@dandi/common'
import { AmbientInjectableScanner, DandiApplication } from '@dandi/core'
import { ConsoleLogListener, DefaultLogging, LoggingModule } from '@dandi/core/logging'
import { LogLevel } from '@dandi/core/types'
import { ClientScope } from '@mp-server/shared/client'
import { EntitiesModule } from '@mp-server/shared/entities'
import { EntitySharedModule } from '@mp-server/shared/entity'

import { GameClientApplication } from './game-client-application'
import { UiModule } from './lib/ui'
import { WebSocketClientModule } from './lib/ws'
import {
  ClientEntitySpawnedEntityParentInjectorFnProvider,
  ClientUiModule,
  GameClientConnection,
  KeyboardInput,
} from './ui'

const ENV = NODE_ENV || 'dev'

export const client = new DandiApplication({
  providers: [
    AmbientInjectableScanner,

    LoggingModule.use(
      ConsoleLogListener,
      DefaultLogging.clone().set({
        timestampTag: false,
        filter: LogLevel.debug,
      }),
    ),

    WebSocketClientModule.config({ endpoint: `${document.baseURI.replace(/http/, 'ws')}ws` }),
    UiModule,

    GameClientApplication,
    GameClientConnection,
    ClientUiModule.useInput(KeyboardInput),
    EntitySharedModule.config(ClientScope, ClientEntitySpawnedEntityParentInjectorFnProvider),
    EntitiesModule.withAllEntities(),
  ],
})

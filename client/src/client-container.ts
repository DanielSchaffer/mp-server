import { NODE_ENV } from '@dandi/common'
import { AmbientInjectableScanner, DandiApplication } from '@dandi/core'
import { ConsoleLogListener, DefaultLogging, LoggingModule } from '@dandi/core/logging'
import { LogLevel } from '@dandi/core/types'
import { EntitiesModule } from '@mp-server/shared/entities'
import { EntitySharedModule } from '@mp-server/shared/entity'

import { GameClientApplication } from './game-client-application'
import { UiModule } from './lib/ui'
import { WebSocketClientModule } from './lib/ws'
import { AvatarModule } from './ui/avatar'
import { ClientUiGameModule, KeyboardInput } from './ui/game'

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
    AvatarModule,
    ClientUiGameModule.useInput(KeyboardInput),
    EntitySharedModule,
    EntitiesModule.withAllEntities(),
  ],
})

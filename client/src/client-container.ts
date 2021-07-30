import { NODE_ENV } from '@dandi/common'
import { AmbientInjectableScanner, DandiApplication } from '@dandi/core'
import { ConsoleLogListener, DefaultLogging, LoggingModule } from '@dandi/core/logging'
import { LogLevel } from '@dandi/core/types'
import { SharedModule } from '@mp-server/shared'

import { GameClient } from './game-client'
import { WebSocketClientModule } from './lib/ws'
import { UiModule } from './lib/ui'
import { ClientUiGameModule, KeyboardInput } from './ui/game'

const ENV = NODE_ENV || 'dev'

export const client = new DandiApplication({
  providers: [
    AmbientInjectableScanner,

    LoggingModule.use(ConsoleLogListener, DefaultLogging.clone().set({
      timestampTag: false,
      filter: LogLevel.debug,
    })),

    WebSocketClientModule.config({ endpoint: `${document.baseURI.replace(/http/, 'ws')}ws`}),
    UiModule,

    GameClient,
    ClientUiGameModule.useInput(KeyboardInput),
  ],
})

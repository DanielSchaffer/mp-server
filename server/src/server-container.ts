import { MvcExpressModule } from '@dandi-contrib/mvc-express'
import { PugViewEngine } from '@dandi-contrib/mvc-view-pug'
import { CascadingCache, MemoryCache, ServiceContextCacheKeyGenerator } from '@dandi/cache'
import { NODE_ENV } from '@dandi/common'
import { IS_DEV_ENV } from '@dandi/common/src/environment'
import { AmbientInjectableScanner, DandiApplication, LogLevel } from '@dandi/core'
import { ConsoleLogListener, DefaultLogging, LoggingModule } from '@dandi/core/logging'
import { HttpHeader } from '@dandi/http'
import { CorsConfig, HttpPipelineModule } from '@dandi/http-pipeline'
import { PrettyColorsLogging } from '@dandi/logging'
import { MvcHalModule } from '@dandi/mvc-hal'
import { MvcViewModule } from '@dandi/mvc-view'
import { WebSocketServerModule } from '@dandi/websockets'
import { SharedModule } from '@mp-server/shared'

import { ClientController } from './client/client-controller'
import { GameModule } from './game'

/* eslint-disable @typescript-eslint/no-magic-numbers */

const ENV = NODE_ENV || 'dev'

const CORS_DEFAULT: CorsConfig = {
  allowCredentials: true,
  allowHeaders: [HttpHeader.authorization],
}

const CORS_ENV: CorsConfig =
  ENV === 'dev'
    ? {
        allowOrigin: [/localhost:\d{2,5}/, /127\.0\.0\.1:\d{2,5}/, /192\.168\.\d{1,3}\.\d{1,3}:\d{2,5}/],
      }
    : {
        allowOrigin: [/whateverthisis\.com$/],
      }

const CORS = Object.assign({}, CORS_DEFAULT, CORS_ENV)

const loggingConfig = IS_DEV_ENV
  ? PrettyColorsLogging.set({ filter: LogLevel.debug })
  : DefaultLogging.clone().set({
      timestampTag: false,
      filter: LogLevel.info,
    })

export const server = new DandiApplication({
  providers: [
    // DI
    AmbientInjectableScanner,
    LoggingModule.use(ConsoleLogListener, loggingConfig),

    // MVC
    HttpPipelineModule.cors(CORS),
    MvcExpressModule.config({ port: Number(process.env.PORT) || 10001 }),
    MvcViewModule.engine('pug', PugViewEngine.config({ cache: ENV !== 'dev' })),
    MvcHalModule,

    // WebSockets
    WebSocketServerModule.config({ path: '/ws' }),

    // Cache
    CascadingCache,
    MemoryCache,
    ServiceContextCacheKeyGenerator,

    // Controllers
    ClientController,

    GameModule.config({ tickInterval: 100 }),
    SharedModule.config({ subtickTimingSource: false }),
    // Service Implementations
  ],
})

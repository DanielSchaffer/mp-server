import { Provider } from '@dandi/core'
import { HighResTimeProvider } from '@mp-server/shared'

function processHighResTime(): bigint {
  return process.hrtime.bigint()
}

export const ProcessHighResTime: Provider<HighResTimeProvider> = {
  provide: HighResTimeProvider,
  useValue: processHighResTime,
}

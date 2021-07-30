console.log('[dev-init]')
require('ts-node/register')
require('tsconfig-paths/register')
console.log(
  require('dotenv').config({
    path: require('path').resolve(process.cwd(), '.env'),
  }),
)

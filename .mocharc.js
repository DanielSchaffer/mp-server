const { dirname, resolve } = require('path')

module.exports = {
  extension: 'ts',
  ignore: ['.out', '.build', 'dist'],
  watchIgnore: ['.out', '.build', 'dist'],
  require: [
    'tsconfig-paths/register',
    resolve(__dirname, './test/ts-node.js'),
    // 'ts-custom-error-shim',
    resolve(__dirname, './test/mocha.config'),
  ],
  // file: [resolve(__dirname, 'test/sandbox.ts'), ...manifest],
  spec: [
    './shared/src/**/*.spec.ts',
    './shared/client/src/**/*.spec.ts',
    './shared/entity/src/**/*.spec.ts',
    './shared/server/src/**/*.spec.ts',
    './client/src/**/*.spec.ts',
    './dandi/*/src/**/*.spec.ts',
    './server/src/**/*.spec.ts',
  ],
}

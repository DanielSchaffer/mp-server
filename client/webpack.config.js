const { resolve } = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    main: './src/main.ts',
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: {
      '@mp-server/common': resolve(__dirname, '../common'),
      '@mp-server/common/rxjs': resolve(__dirname, '../common/rxjs'),
      '@mp-server/shared': resolve(__dirname, '../shared'),

      // @dandi web-ifying
      'url': resolve(__dirname, 'node_modules/url'),
      'util': resolve(__dirname, 'util-shim.js'),
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ],
      },
    ],
  },
  devServer: {
    port: 10002,
  }
}

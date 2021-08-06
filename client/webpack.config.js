const { resolve } = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    main: './src/main.ts',
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: {
      '@mp-server/common': resolve(__dirname, '../common'),
      '@mp-server/common/rxjs': resolve(__dirname, '../common/rxjs'),
      '@mp-server/shared': resolve(__dirname, '../shared'),
      '@mp-server/shared/client': resolve(__dirname, '../shared/client'),
      '@mp-server/shared/entities': resolve(__dirname, '../shared/entities'),
      '@mp-server/shared/entity': resolve(__dirname, '../shared/entity'),
      '@mp-server/shared/player': resolve(__dirname, '../shared/player'),
      '@mp-server/shared/server': resolve(__dirname, '../shared/server'),

      // @dandi web-ifying
      url: resolve(__dirname, 'node_modules/url'),
      util: resolve(__dirname, 'util-shim.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
  devServer: {
    port: 10002,
  },
  stats: 'normal',
}

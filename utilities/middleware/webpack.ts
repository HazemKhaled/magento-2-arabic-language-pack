/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Initialize Webpack middleware in development
 */
export function webpackMiddlewares(): unknown[] {
  if (process.env.NODE_ENV === 'production') return [];

  const webpack = require('webpack');
  const devMiddleware = require('webpack-dev-middleware');
  const hotMiddleware = require('webpack-hot-middleware');
  const config = require('../../../webpack.dev.js');

  const compiler = webpack(config);

  return [
    // Webpack middleware
    devMiddleware(compiler, {
      publicPath: config.output.publicPath,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),

    // Webpack hot replacement
    hotMiddleware(compiler, {
      log: console.info,
    }),
  ];
}

/**
 * Initialize Webpack middleware in development
 */
export function initWebpackMiddlewares(): unknown[] {
  if (process.env.NODE_ENV === 'production') return [];

  const webpack = require('webpack');
  const devMiddleware = require('webpack-dev-middleware');
  const hotMiddleware = require('webpack-hot-middleware');
  const config = require('../../webpack.config').default;

  const compiler = webpack(config);

  return [
    // Webpack middleware
    devMiddleware(compiler, {
      noInfo: true,
      publicPath: config.output.publicPath,
      headers: { 'Access-Control-Allow-Origin': '*' },
      stats: { colors: true },
    }),

    // Webpack hot replacement
    hotMiddleware(compiler, {
      log: console.info,
    }),
  ];
}

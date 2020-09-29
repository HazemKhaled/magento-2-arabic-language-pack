const path = require('path');
const { merge } = require('webpack-merge');

const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  plugins: [
    new ServiceWorkerWebpackPlugin({
      entry: path.join(__dirname, 'client/sw.ts'),
      filename: 'service-worker.js',
    }),
  ],
  optimization: {
    runtimeChunk: 'single',
    minimizer: [
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
  },
});

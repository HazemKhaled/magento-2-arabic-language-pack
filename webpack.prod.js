const path = require('path');
const { merge } = require('webpack-merge');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',

  plugins: [
    new ServiceWorkerWebpackPlugin({
      entry: path.join(__dirname, 'client/sw.js'),
      filename: 'service-worker.js',
    }),
  ],
});

const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: '#eval-source-map',

  entry: {
    app: ['webpack-hot-middleware/client'],
  },

  plugins: [new webpack.HotModuleReplacementPlugin()],
});

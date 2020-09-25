import * as path from 'path';

import * as webpack from 'webpack';
import VueLoaderPlugin from 'vue-loader/lib/plugin';

const config: webpack.Configuration = {
  mode: 'development',
  devtool: '#eval-source-map',

  entry: {
    app: [
      'webpack-hot-middleware/client',
      path.join(__dirname, 'client', 'main.js'),
    ],
  },

  output: {
    path: path.join(__dirname, '../public'),
    filename: '[name].js',
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            scss: ['vue-style-loader', 'css-loader', 'sass-loader'],
          },
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['vue-style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
    ],
  },

  plugins: [new webpack.HotModuleReplacementPlugin(), new VueLoaderPlugin()],

  resolve: {
    extensions: ['.vue', '.js', '.json', '.ts', '.tsx', '.js'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },

  performance: {
    hints: false,
  },
};

export default config;

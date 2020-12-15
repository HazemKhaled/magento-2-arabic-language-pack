const path = require('path');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// render page
const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: {
    app: [path.join(__dirname, '/client', 'main.ts')],
  },

  output: {
    path: path.join(__dirname, '/public'),
    filename: '[name].js',
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            stylus: ['vue-style-loader', 'css-loader', 'stylus-loader'],
          },
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          // 'vue-style-loader',
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { sourceMap: isDev } },
        ],
      },
      {
        test: /\.styl(us)?$/,
        use: [
          // 'vue-style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'stylus-loader',
        ],
      },
      {
        test: /\.pug$/,
        loader: 'pug-plain-loader',
      },
    ],
  },

  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
  ],

  resolve: {
    extensions: ['.vue', '.js', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'client'),
    },
  },
};

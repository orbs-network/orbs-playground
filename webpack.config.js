const path = require('path');
const ManifestPlugin = require('webpack-manifest-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const cssnano = require('cssnano');

const config = require('./src/server/config');
const { SERVER_PORT, IS_DEV, WEBPACK_PORT } = config;
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const plugins = [new MonacoWebpackPlugin(), new ManifestPlugin()];

const APP_DIR = path.resolve(__dirname, './src/client');
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');

//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
//plugins.push(new BundleAnalyzerPlugin());

if (IS_DEV) {
  plugins.push(new OpenBrowserPlugin({ url: `http://localhost:${SERVER_PORT}` }));
}

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  devtool: IS_DEV ? 'inline-source-map' : '',
  entry: ['@babel/polyfill', './src/client/client'],
  output: {
    path: path.join(__dirname, 'dist', 'statics'),
    filename: `[name]-[hash:8]-bundle.js`,
    publicPath: '/statics/',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loaders: ['babel-loader'],
        exclude: [/node_modules/, nodeModulesPath],
      },
      {
        test: /\.css$/,
        include: APP_DIR,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              camelCase: true,
              sourceMap: IS_DEV,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: IS_DEV,
              plugins: IS_DEV ? [cssnano()] : [],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: MONACO_DIR,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /.jpe?g$|.gif$|.png$|.svg$|.woff$|.woff2$|.ttf$|.eot$/,
        use: 'url-loader?limit=10000',
      },
    ],
  },
  devServer: {
    port: WEBPACK_PORT,
  },
  plugins,
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};

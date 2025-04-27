/**
 * Webpack main configuration file
 */

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isDev = process.argv.includes('--mode=development') || process.env.NODE_ENV === 'development';
const isProd = !isDev;
const minimizeAssets = isProd;

const environment = require('./configuration/environment');

const templateFiles = fs
  .readdirSync(environment.paths.source)
  .filter((file) => ['.html', '.ejs'].includes(path.extname(file).toLowerCase()))
  .map((filename) => ({
    input: filename,
    output: filename.replace(/\.ejs$/, '.html'),
    name: filename.split('.')[0],
  }));

const htmlPluginEntries = templateFiles.map((template) => {
  return new HTMLWebpackPlugin({
    inject: true,
    filename: template.output,
    template: path.resolve(environment.paths.source, template.input),
    favicon: path.resolve(environment.paths.source, 'images', 'favicon.ico'),
    chunks: ['index', template.name],
  });
});

const globOptions = {
  dot: true,
  gitignore: !isDev,
  ignore: [
    '*.DS_Store',
    'Thumbs.db',
    // Temp files...
    '**/*.sw?',
    '**/*.tmp',
    '**/*~',
    '**/*_',
  ],
};

module.exports = {
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'inline-source-map' : 'source-map',
  entry: {
    index: path.resolve(environment.paths.source, 'index.js'),
  },
  output: {
    filename: '[name].[fullhash:6].js',
    path: environment.paths.output,
  },
  /* Development Server Configuration */
  devServer: {
    static: {
      directory: environment.paths.output,
      publicPath: '/',
      watch: true,
    },
    client: {
      overlay: true,
    },
    open: false,
    compress: true,
    hot: true,
    ...environment.server,
  },
  /* File watcher options */
  watchOptions: {
    aggregateTimeout: 300,
    poll: 300,
    ignored: /node_modules/,
  },
  module: {
    rules: [
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: environment.limits.images,
          },
        },
        generator: {
          filename: 'assets/fonts/[name].[hash:6][ext]',
        },
      },
      {
        test: /\.((c|sa|sc)ss)$/i,
        // use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
            },
          },
          // Translates CSS into CommonJS
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                mode: 'icss',
              },
              sourceMap: true,
              url: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
            },
          },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                // @see https://github.com/sass/node-sass#outputstyle
                outputStyle: minimizeAssets ? 'compressed' : 'expanded',
              },
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(png|gif|jpe?g|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: environment.limits.images,
          },
        },
        generator: {
          filename: 'images/[name].[hash:6][ext]',
        },
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-webpack-loader',
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    minimizer: [
      // '...', // ???
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        // exclude: 'assets',
        terserOptions: {
          compress: {
            drop_debugger: false,
          },
        },
      }),
      new CssMinimizerPlugin(),
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            // Lossless optimization with custom option
            // Feel free to experiment with options for better result for you
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              // Svgo configuration here https://github.com/svg/svgo#configuration
              [
                'svgo',
                {
                  plugins: [
                    {
                      name: 'removeViewBox',
                      active: false,
                    },
                  ],
                },
              ],
            ],
          },
        },
      }),
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'underscore',
    }),
    isProd &&
      new CleanWebpackPlugin({
        verbose: true,
        cleanOnceBeforeBuildPatterns: ['**/*', '!stats.json'],
      }),
    new MiniCssExtractPlugin({
      filename: '[name].[fullhash:6].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, 'public/'),
          from: '**/*',
          to: path.resolve(environment.paths.output),
          toType: 'dir',
          globOptions,
        },
        {
          context: path.resolve(environment.paths.source),
          from: 'project-*.txt',
          to: path.resolve(environment.paths.output),
          toType: 'dir',
        },
        {
          from: path.resolve(environment.paths.source, 'images', 'content'),
          to: path.resolve(environment.paths.output, 'images', 'content'),
          toType: 'dir',
          globOptions,
        },
        {
          from: path.resolve(environment.paths.source, 'script'),
          to: path.resolve(environment.paths.output, 'script'),
          toType: 'dir',
          globOptions,
        },
      ],
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map[query]',
    }),
  ]
    .filter(Boolean)
    .concat(htmlPluginEntries),
  target: 'web',
};

/**
 * Webpack main configuration file
 */

const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const environment = require('./configuration/environment');

const templateFiles = fs
  .readdirSync(environment.paths.source)
  .filter((file) => ['.html', '.ejs'].includes(path.extname(file).toLowerCase()))
  .map((filename) => ({
    input: filename,
    output: filename.replace(/\.ejs$/, '.html'),
    name: filename.split('.')[0],
  }));

const htmlPluginEntries = templateFiles.map(
  (template) =>
    new HTMLWebpackPlugin({
      inject: true,
      hash: true,
      filename: template.output,
      template: path.resolve(environment.paths.source, template.input),
      favicon: path.resolve(environment.paths.source, 'images', 'favicon.ico'),
      chunks: ['app', template.name],
    }),
);

const isDev = process.env.NODE_ENV === 'development';
const minimizeAssets = !isDev;

const globOptions = {
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
    // app: path.resolve(environment.paths.source, 'js', 'app.js'),
    index: path.resolve(environment.paths.source, 'js', 'index.js'),
  },
  output: {
    filename: 'js/[name].[hash:6].js',
    path: environment.paths.output,
  },
  module: {
    rules: [
      // {
      //   test: /\.woff2?$/,
      //   type: 'asset/resource',
      //   generator: {
      //     filename: 'images/design/[name].[hash:6][ext]',
      //   },
      // },
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
              // modules: true,
              modules: {
                // compileType: 'icss',
                // mode: 'local',
                mode: 'icss',
              },
              sourceMap: true,
              url: true,
            },
          },
          {
            loader: 'postcss-loader',
          },
          /* // UNUSED: resolve-url-loader
           * {
           *   loader: 'resolve-url-loader',
           *   options: {
           *     sourceMap: true,
           *   },
           * },
           */
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              /* // NOTE: Inject 'use' for math and color features, import common variables and mixins.
               * additionalData: [
               *   // '@use "sass:math";',
               *   // '@use "sass:color";',
               *   // '@import "src/variables.scss";',
               *   // '@import "src/mixins.scss";',
               * ]
               *   .filter(Boolean)
               *   .join('\n'),
               */
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
        test: /\.ya?ml$/,
        use: 'yaml-loader',
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
        extractComments: false,
        // exclude: 'assets',
        terserOptions: {
          compress: {
            drop_debugger: false,
          },
        },
      }),
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
    new MiniCssExtractPlugin({
      filename: 'css/[name].[hash:6].css',
    }),
    new CleanWebpackPlugin({
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['**/*', '!stats.json'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        // {
        //   context: path.resolve(__dirname),
        //   from: 'favicon.ico',
        //   to: path.resolve(environment.paths.output),
        //   toType: 'dir',
        // },
        {
          context: path.resolve(__dirname, 'public/'),
          from: '*',
          to: path.resolve(environment.paths.output),
          toType: 'dir',
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
          from: path.resolve(environment.paths.source, 'data'),
          to: path.resolve(environment.paths.output, 'data'),
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
  ].concat(htmlPluginEntries),
  target: 'web',
};

const path = require('path');

const ManifestPlugin = require('webpack-manifest-plugin');

const outputPath = path.resolve(__dirname, 'build');

module.exports = {
  entry: './src/main.ts',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(otf|ttf|ttc)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'fonts/'
          }
        }]
      }
    ]
  },
  resolve: {
    alias: {
      'ImGui': path.resolve(__dirname, 'src', 'imgui'),
      'GL': path.resolve(__dirname, 'src', 'gl'),
      'IO': path.resolve(__dirname, 'src', 'io'),
      'Net': path.resolve(__dirname, 'src', 'net'),
      'Store': path.resolve(__dirname, 'src', 'store'),
      'Api': path.resolve(__dirname, 'src', 'api'),
      'Fonts': path.resolve(__dirname, 'assets', 'fonts'),
    },
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'rpgcore.[contenthash].js',
    library: 'rpgcore',
    libraryTarget: 'umd',
    path: outputPath,
    publicPath: '/static/bundle/',
  },
  watchOptions: {
    ignored: /node_modules/
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new ManifestPlugin(),
  ]
};

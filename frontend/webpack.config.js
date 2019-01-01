const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');

const rootPath = __dirname;
const outputPath = path.resolve(rootPath, 'build');

const pathsToClean = [
  'build/*',
];

const cleanOptions = {
  root: rootPath,
  verbose: true,
  watch: true,
};


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
      "ImGui": path.resolve(__dirname, 'src', 'imgui'),
      "GL": path.resolve(__dirname, 'src', 'gl'),
      "IO": path.resolve(__dirname, 'src', 'io'),
      "Net": path.resolve(__dirname, 'src', 'net'),
      "Store": path.resolve(__dirname, 'src', 'store'),
      "Fonts": path.resolve(__dirname, 'fonts'),
    },
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: "rpgcore.js",
    library: "rpgcore",
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
    new CleanWebpackPlugin(pathsToClean, cleanOptions),
  ]
};

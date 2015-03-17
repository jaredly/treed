
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var fs = require('fs')
  , path = require('path')

var dirs = fs.readdirSync(__dirname).filter(function (name) {
  return fs.statSync(path.join(__dirname, name)).isDirectory()
})

var entries = {}

dirs.forEach(function (name) {
  entries[name] = './' + name + '/index.js'
})


module.exports = {
  entry: entries,
  output: {
    path: './',
    filename: '[name]/build.js',
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader?optional=runtime' },
      { test: /\.json$/, loader: 'json' },

      {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      }
    ],
  },

  devtool: 'eval',
  colors: true,

  plugins: [
      new ExtractTextPlugin("[name]/build.css")
  ],

}


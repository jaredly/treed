
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
    path: path.resolve(__dirname),
    filename: '[name]/build.js',
  },

  module: {
    loaders: [
      { test: /\.js$/
      , exclude: /node_modules/
      , loader: 'babel-loader'
      }

    , { test: /\.json$/, loader: 'json' }

    , { test: /\.css$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
      },
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: "css-loader!less-loader"})
      }
    ],
  },

  devtool: 'eval',
  // colors: true,

  plugins: [
      new ExtractTextPlugin("[name]/build.css")
  ],

}



var Level = require('./level')
  , leveljs = require('level-js')

module.exports = class Ixdb extends Level {
  constructor(opts) {
    super(leveljs, opts)
  }
}


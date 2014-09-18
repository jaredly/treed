
var Level = require('./level')
  , leveljs = require('level-js')

module.exports = Ixdb

function Ixdb (opts) {
  Level.call(this, leveljs, opts)
}

Ixdb.prototype = Object.create(Level.prototype)
Ixdb.prototype.constructor = Ixdb



var merge = require('react/lib/merge')

var MainStore = require('treed/stores/main')
var TempStore = require('treed/stores/temp')
var Db = require('treed/db')

module.exports = {
  run: run
}

function run(options, done) {
  if (arguments.length === 1) {
    done = options
    options = {}
  }
  options = merge({
    mixins: []
  }, options)
  if (!options.PL) {
    options.PL = require('treed/pl/mem')
  }

  var pl = new options.PL()
  var db = new Db(pl)
  db.init(function (err) {
    if (err) return console.error('Failed to start db', err);
    var store = new MainStore({
      mixins: options.mixins,
      pl: db
    })
    done(store)
  })
}

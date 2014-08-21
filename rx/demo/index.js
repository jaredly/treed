
var merge = require('react/lib/merge')

var MainStore = require('treed/stores/main')
var TempStore = require('treed/stores/temp')

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
  pl.init(function (err) {
    if (err) return console.error('Failed to start db', err);
    var actions = new Dispatcher({
      mixins: options.mixins
    })
    var db = new MainStore({
      mixins: options.mixins,
      pl: pl
    })
    var temp = new TempStore({
      mixins: options.mixins
    })
    db.listenTo(actions)
    temp.listenTo(actions)
    done(actions, temp, db)
  })
}


var merge = require('react/lib/merge')

var MainStore = require('../stores/main')
var Db = require('../db')

module.exports = {
  run: run
}

function run(options, done) {
  if (arguments.length === 1) {
    done = options
    options = {}
  }
  options = merge({
    mixins: [],
    children: [
      { content: 'one' },
      {
        content: 'two',
        children: [ {content: 'three'} ]
      }
    ],
  }, options)
  if (!options.PL) {
    options.PL = require('../pl/mem')
  }

  var pl = new options.PL()
  var db = new Db(pl)
  db.init(function (err) {
    if (err) return console.error('Failed to start db', err);
    if (options.children) {
      db.dump(db.root, options.children)
    }
    var store = new MainStore({
      mixins: options.mixins,
      pl: db
    })
    window.store = store
    window.actions = store.actions
    done(store)
  })
}

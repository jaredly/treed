/**
 * Quickstart entry point. If you want to configure things, you're probably
 * better off going custom.
 */

var extend = require('./util/extend')
var keyHandlers = require('./key-handlers')
var baseKeys = require('./stores/keys')

var KeyManager = require('./key-manager')
var MainStore = require('./stores/main')

var Db = require('./db')

class Treed {

  constructor(options) {
    this.options = extend({
      plugins: [],
    }, options || {})

    this.keyManager = new KeyManager()
  }

  initStore(data, options) {
    var options = extend({
      PL: require('./pl/mem'),
      pl: null,
      actions: null,
    }, options)

    var pl = this.pl = options.pl || new options.PL()
    var db = this.db = new Db(pl, pluginType(this.options.plugins, 'db'))
    return new Promise((resolve, reject) => {
      db.init(data, err => {
        if (err) return reject(err)

        var store = this.store = new MainStore({
          actions: options.actions,
          plugins: pluginType(this.options.plugins, 'store'),
          allPlugins: this.options.plugins,
          db: db
        })
        this.keyManager.attach(store)
        resolve(store)
      })
    })
  }

  on (what, handler) {
    this.store.on(what, handler)
  }
  off (what, handler) {
    this.store.on(what, handler)
  }

  removeView(id) {
    this.store.unregisterView(id)
  }

  addView(options) {
    options = extend({
      actions: null,
      keys: {},
      root: null,
    }, options)

    var storeView = this.store.registerView(options.root, options.actions)
    var allKeys = extend({}, flattenKeySections(baseKeys), flattenKeySections(options.keys))

    var props = {
      plugins: pluginType(this.options.plugins, 'view'),
      nodePlugins: pluginType(this.options.plugins, 'node'),
      store: storeView,
    }

    var keys = keyHandlers(
      allKeys,
      storeView.actions,
      pluginType(this.options.plugins, 'keys'),
      this.options.plugins)

    this.keyManager.addView(storeView.id, keys)

    return props
  }

}

function flattenKeySections(keys) {
  var ret = {}
  for (var name in keys) {
    for (var sub in keys[name]) {
      ret[sub] = keys[name][sub]
    }
  }
  return ret
}

function pluginType(plugins, type) {
  if (!plugins) return []
  return plugins.reduce((list, plugin) => {
    if (plugin[type]) list.unshift(plugin[type])
    return list
  }, [])
}

module.exports = Treed


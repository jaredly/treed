/**
 * Quickstart entry point. If you want to configure things, you're probably
 * better off going custom.
 */

var React = require('react')

var extend = require('./util/extend')
var keyHandlers = require('./key-handlers')

var defaultKeys = flattenKeySections(require('./views/tree/keys'))
var KeyManager = require('./key-manager')
var TreeView = require('./views/tree')
var MainStore = require('./stores/main')

var Db = require('./db')

class Treed {

  constructor(options) {
    this.options = extend({
      plugins: [],
      PL: require('./pl/mem'),
      pl: null,
      data: null,
    }, options || {})

    this.keyManager = new KeyManager()
  }

  initStore(options) {
    var options = this.options

    var pl = this.pl = options.pl || new options.PL()
    var db = this.db = new Db(pl, pluginType(this.options.plugins, 'db'))
    return new Promise((resolve, reject) => {
      db.init(options.data, err => {
        if (err) return reject(err)

        var store = this.store = new MainStore({
          plugins: pluginType(options.plugins, 'store'),
          allPlugins: options.plugins,
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

  addView(options) {
    options = extend({
      root: null,
      defaultKeys: defaultKeys,
    }, options)

    var storeView = this.store.registerView(options.root)

    var props = {
      plugins: pluginType(this.options.plugins, 'view'),
      nodePlugins: pluginType(this.options.plugins, 'node'),
      store: storeView,
    }

    var keys = keyHandlers(
      options.defaultKeys,
      storeView.actions,
      pluginType(this.options.plugins, 'keys'),
      this.options.plugins)

    this.keyManager.addView(storeView.id, keys)

    return props
  }

  quickstart(el, options) {
    options = options || {}
    el = ensureElement(el)

    this.keyManager.listen(window)

    return this.initStore().then(() => {
      return new Promise((resolve, reject) => {
        var View = options.View || TreeView
          , props = this.addView(options)

        React.render(<View {...props}/>, el, function (err) {
          if (err) return reject(err)
          resolve(props.store)
        })
      })
    }).catch(error => {
      console.warn('Treed initialization failed!', error)
      throw error
    });
  }

}

function ensureElement(el) {
  if ('string' === typeof el) {
    var found = document.querySelector(el)
    if (!found) throw new Error('element not found: ' + el)
    el = found
  }
  return el
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


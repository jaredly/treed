/**
 * Quickstart entry point. If you want to configure things, you're probably
 * better off going custom.
 */

var React = require('react')

var extend = require('./util/extend')
var keyHandlers = require('./key-handlers')

var defaultKeys = flattenKeySections(require('./views/list/keys'))
var KeyManager = require('./key-manager')
var ListView = require('./views/list')
var MainStore = require('./stores/main')

function flattenKeySections(keys) {
  var ret = {}
  for (var name in keys) {
    for (var sub in keys[name]) {
      ret[sub] = keys[name][sub]
    }
  }
  return ret
}

var Db = require('./db')

module.exports = {
  quickstart,

  initView,
  initStore,
  pluginType,
  viewConfig,
}

/*
 * get a store
 * add a view to the store
 */

function quickstart(el, options, done) {
  options = extend({
    viewOptions: {},
    storeOptions: {},
    plugins: [],
  }, options || {})

  if ('string' === typeof el) {
    var found = document.querySelector(el)
    if (!found) throw new Error('element not found: ' + el)
    el = found
  }

  initStore(options.plugins, options.storeOptions, (err, store) => {
    if (err) return done(err)
    var keyManager = new KeyManager()
    keyManager.attach(store)
    initView(el, store, keyManager, options.plugins, options.viewOptions, (storeView) => {
      keyManager.listen(window)
      done && done(err, store, keyManager, storeView)
    })
  })
}

function initStore(plugins, options, done) {
  options = extend({
    PL: require('./pl/mem'),
    pl: null,
    data: null,
  }, options)

  var pl = options.pl || new options.PL()
  var db = new Db(pl, pluginType(plugins, 'db'))
  db.init(options.data, function (err) {
    if (err) return done(err)

    var store = new MainStore({
      plugins: pluginType(plugins, 'store'),
      allPlugins: plugins,
      db: db
    })
    done(null, store)
  })
}

function viewConfig(store, plugins, options) {
  options = extend({
    root: null,
    defaultKeys: defaultKeys,
  }, options)

  var storeView = store.registerView(options.root)

  var props = {
    plugins: pluginType(plugins, 'view'),
    nodePlugins: pluginType(plugins, 'node'),
    store: storeView,
  }
  return {
    keys: keyHandlers(options.defaultKeys, storeView.actions, pluginType(plugins, 'keys'), plugins),
    view: storeView,
    props: props
  }
}

function initView(el, store, keyManager, plugins, options, done) {
  options = extend({
    View: ListView,
  }, options)

  var config = viewConfig(store, plugins, options)
  keyManager.addView(config.view.id, config.keys)

  React.render(options.View(config.props), el, function () {
    done(config.view)
  })
}

function pluginType(plugins, type) {
  if (!plugins) return []
  return plugins.reduce((list, plugin) => {
    return plugin[type] ? [plugin[type]].concat(list) : list
  }, [])
}


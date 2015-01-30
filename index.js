/**
 * Quickstart entry point. If you want to configure things, you're probably
 * better off going custom.
 */

var React = require('react')

var extend = require('./util/extend')
var keyHandlers = require('./key-handlers')

var keys = require('./views/tree/keys')
var KeyManager = require('./key-manager')
var TreeView = require('./views/tree')
var MainStore = require('./stores/main')

var Db = require('./db')

module.exports = {
  quickstart,

  initView,
  initStore,
  pluginType,
  viewConfig,
}

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
    var keys = new KeyManager()
    keys.attach(store)
    initView(el, store, keys, options.plugins, options.viewOptions, (storeView) => {
      keys.listen(window)
      done && done(err, store, keys, storeView)
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
  window.db = db
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
    defaultKeys: keys,
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

function initView(el, store, keys, plugins, options, done) {
  options = extend({
    View: TreeView,
  }, options)

  var config = viewConfig(store, plugins, options)
  keys.addView(config.view.id, config.keys)

  React.renderComponent(options.View(config.props), el, function () {
    done(config.view)
  })
}

function pluginType(plugins, type) {
  if (!plugins) return []
  return plugins.reduce((list, plugin) => {
    return plugin[type] ? [plugin[type]].concat(list) : list
  }, [])
}


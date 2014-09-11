/**
 * Quickstart entry point. If you want to configure things, you're probably
 * better off going custom.
 */

var React = require('react')

var extend = require('./util/extend')
var keyHandlers = require('./key-handlers')

var keys = require('./views/tree/keys')
var TreeView = require('./views/tree')
var MainStore = require('./stores/main')

var Db = require('./db')

module.exports = {
  quickstart: quickstart,
  initView: initView,
  initStore: initStore,
  pluginType: pluginType,
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

  initStore(options.plugins, options.storeOptions, (store) => {
    initView(el, store, options.plugins, options.viewOptions, (storeView) => {
      done && done(store, storeView)
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
    if (err) return console.error('Failed to start db', err);

    var store = new MainStore({
      plugins: pluginType(plugins, 'store'),
      db: db
    })
    done(store)
  })
}

function initView(el, store, plugins, options, done) {
  options = extend({
    View: TreeView,
    defaultKeys: keys,
  }, options)

  var storeView = store.registerView()

  var props = {
    plugins: pluginType(plugins, 'view'),
    nodePlugins: pluginType(plugins, 'node'),
    keys: keyHandlers(options.defaultKeys, storeView.actions, pluginType(plugins, 'keys')),
    store: storeView,
  }

  if (!el) {
    return done(storeView, props)
  }

  React.renderComponent(options.View(props), el, function () {
    done(storeView)
  })
}

function pluginType(plugins, type) {
  if (!plugins) return []
  return plugins.reduce((list, plugin) => {
    return plugin[type] ? [plugin[type]].concat(list) : list
  }, [])
}


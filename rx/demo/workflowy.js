
var React = require('react')

window.React = React

var TreeView = require('../views/tree')
var keys = require('../views/tree/keys')
var keyHandlers = require('../key-handlers')

var plugins = [
  // require('../plugins/collapse'),
  // require('../plugins/tags'),
  require('../plugins/rebase'),
  require('../plugins/done'),
]

function pluginType(plugins, type) {
  return plugins.reduce((list, plugin) => {
    return plugin[type] ? [plugin[type]].concat(list) : list
  }, [])
}

require('./').run({
  plugins: plugins,
}, function (store) {
  React.renderComponent(TreeView({
    plugins: pluginType(plugins, 'view'),
    nodePlugins: pluginType(plugins, 'view'),
    keys: keyHandlers(keys, store.actions, pluginType(plugins, 'keys')),
    store: store,
  }), document.getElementById('example'))
})


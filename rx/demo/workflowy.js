
var React = require('react')

var treed = require('../')
var data = require('./demo-data')

window.React = React

var plugins = [
  require('../plugins/tags'),
  require('../plugins/rebase'),
  require('../plugins/collapse'),
  require('../plugins/done'),
]

var start = Date.now()
treed.quickstart('#example', {
  plugins: plugins,
  storeOptions: {data: data},
}, (store) => {
  console.log((Date.now() - start) + 'ms to render')
  window.store = store
  window.actions = store.actions
})


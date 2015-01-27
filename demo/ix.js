
var React = require('react')

var treed = require('../')
var data = require('./demo-data')
var IxPL = require('../pl/ixdb')
var QueuePL = require('../pl/queuedb')

window.React = React

var start = Date.now()
treed.quickstart('#example', {
  plugins: [
    require('../plugins/clipboard'),
    require('../plugins/collapse'),
    require('../plugins/undo'),
  ],
  storeOptions: {
    data: data,
    pl: new IxPL(), // new QueuePL(new IxPL())
  },
}, (store) => {
  console.log((Date.now() - start) + 'ms to render')
  window.store = store
  window.actions = store.actions
})


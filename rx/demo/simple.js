
var React = require('react')

var treed = require('../')
var data = require('./demo-data')

window.React = React

var start = Date.now()
treed.quickstart('#example', {
  storeOptions: {data: data},
}, (store) => {
  console.log((Date.now() - start) + 'ms to render')
  window.store = store
  window.actions = store.actions
})



var React = require('react')
var Treed = require('../classy')

var treed = window.treed = new Treed({
  data: require('./demo-data'),
})

var start = Date.now()
treed.quickstart('#example').then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.actions = storeView.actions
}).catch(error => {
  document.getElementById('error').innerHTML = 'Failed to initialize: ' + error.message + '<br>' + error.stack
})


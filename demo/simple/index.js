
import './index.less'

var React = require('react')
var Treed = require('../../quickstart')

var treed = window.treed = new Treed()

var start = Date.now()
treed.quickstart('#example', {
  data: require('../demo-data'),
}).then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.actions = storeView.actions
}).catch(error => {
  document.getElementById('error').innerHTML = 'Failed to initialize: ' + error.message + '<br>' + error.stack
})


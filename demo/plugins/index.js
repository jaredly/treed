
import './index.less'

var React = require('react')
var Treed = require('../../quickstart')

var treed = window.treed = new Treed({
  plugins: [
    require('../../plugins/todo'),
    require('../../plugins/rebase'),
    require('../../plugins/clipboard'),
    require('../../plugins/collapse'),
    require('../../plugins/undo'),
    require('../../plugins/done'),
    require('../../plugins/types'),
    require('../../plugins/image'),
    require('../../plugins/lists'),
  ]
})

var start = Date.now()
treed.quickstart('#example', {
  data: require('../demo-data'),
}).then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.actions = storeView.actions
}).catch(error => {
  alert("Failed to initialize: " + error)
})


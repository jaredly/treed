
import './index.less'

var React = require('react')

var Treed = require('../../quickstart')
var data = require('../demo-data')
var IxPL = require('../../pl/ixdb')

window.React = React

var treed = window.treed = new Treed({
  plugins: [
    require('../../plugins/undo'),
    // require('../../plugins/tags'),
    require('../../plugins/rebase'),
    require('../../plugins/collapse'),
    require('../../plugins/done'),
  ]
})

var start = Date.now()
treed.quickstart('#example', {
  data: data,
}).then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.storeView = storeView

  treed.startView(document.getElementById('right-side')).then(otherView => {
    window.sideView = otherView
  })
})



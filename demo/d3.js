
var React = require('react')
var Treed = require('../classy')
var D3Tree = require('./d3tree')

window.title = 'Full Soup'

var treed = window.treed = new Treed({
  data: require('./demo-data'),
  plugins: [
    require('../plugins/clipboard'),
    require('../plugins/collapse'),
    require('../plugins/undo'),
    require('../plugins/done'),
  ]
})

var start = Date.now()
treed.quickstart('#example').then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.actions = storeView.actions
  window.storeView = storeView

  var d3tree = window.d3tree = new D3Tree('#tree', {
    onCollapse: (id, val) => {
      storeView.actions.set(id, 'collapsed', val)
      storeView.actions.setActive(id)
    },
    onClickNode: (id) => {
      storeView.actions.change(id)
    },
  })

  function update() {
    d3tree.update(treed.store.db.exportTree(null, true), storeView.view.active)
  }

  function upActive() {
    d3tree.setActive(storeView.view.active)
  }

  treed.on('changed', update)
  treed.on('active-node:' + storeView.view.id, upActive)
  update()
  upActive()

}).catch(error => {
  alert("Failed to initialize: " + error)
})


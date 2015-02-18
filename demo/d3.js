
var React = require('react')
var Treed = require('../classy')
var D3Tree = require('./d3tree')

window.title = 'Full Soup'

var treed = window.treed = new Treed({
  data: require('./demo-data'),
  plugins: [
    require('../plugins/todo'),
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

  var d3tree = window.d3tree = new D3Tree('#tree', {
    onCollapse: (id, val) => {
      storeView.actions.set(id, 'collapsed', val)
    },
    onClickNode: (id) => {
      storeView.actions.edit(id)
    },
  })

  function update() {
    d3tree.update(treed.store.db.exportTree(null, true))
  }

  treed.on('changed', update)
  update()

}).catch(error => {
  alert("Failed to initialize: " + error)
})


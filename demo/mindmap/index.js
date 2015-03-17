
var React = require('react')
var Treed = require('../../quickstart')
var Mindmap = require('../../views/mindmap')
var MindmapActions = require('../../views/mindmap/actions')
var MindmapKeys = require('../../views/mindmap/keys')

var treed = window.treed = new Treed({
  plugins: [
    require('../../plugins/undo'),
    require('../../plugins/collapse'),
    require('../../plugins/clipboard'),
    /*
    require('../plugins/todo'),
    require('../plugins/rebase'),
    require('../plugins/done'),
    require('../plugins/types'),
    require('../plugins/image'),
    require('../plugins/lists'),
    */
  ]
})

var start = Date.now()
treed.quickstart('#example', {
  data: require('./data'),
  View: Mindmap,
  actions: MindmapActions,
  keys: MindmapKeys,
}).then(storeView => {
  console.log((Date.now() - start) + 'ms to render')
  window.actions = storeView.actions
}).catch(error => {
  alert("Failed to initialize: " + error)
})


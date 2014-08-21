
var TreeView = require('treed/views/tree')

var Rebase = require('treed/mixins/rebase')
// var Tags = require('treed/mixins/tags')
var Done = require('treed/mixins/done')

var demo = require('./')

demo.run({
  mixins: [
    Rebase,
    Done
  ],
}, function (store) {
  React.renderComponent(TreeView({
    mixins: [Rebase, Done],
    store: store,
  }), document.getElementById('example'))
})


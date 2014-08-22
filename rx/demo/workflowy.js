
var React = require('react')
var TreeView = require('../views/tree')

var Rebase = require('../mixins/rebase')
// var Tags = require('../mixins/tags')
var Done = require('../mixins/done')

var demo = require('./')

demo.run({
  mixins: [
    Rebase,
    // Tags,
    Done
  ],
}, function (store) {
  React.renderComponent(TreeView({
    mixins: [Rebase, Done],
    store: store,
  }), document.getElementById('example'))
})


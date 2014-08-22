
var React = require('react')
var treed = require('treed')
var TreeView = require('treed/views/tree')

var demo = require('./')

demo.run(function (store) {
  React.renderComponent(TreeView({
    store: store
  }), document.getElementById('example'))
})


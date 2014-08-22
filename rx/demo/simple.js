
var React = require('react')
var TreeView = require('../views/tree')

window.React = React

var demo = require('./')

demo.run(function (store) {
  React.renderComponent(TreeView({
    store: store
  }), document.getElementById('example'))
})


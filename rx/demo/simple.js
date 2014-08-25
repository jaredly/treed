
var React = require('react')
var TreeView = require('../views/tree')
var keys = require('../views/tree/keys')
var keyHandlers = require('../key-handlers')

window.React = React

var demo = require('./')

demo.run(function (store) {
  React.renderComponent(TreeView({
    store: store,
    keys: keyHandlers(keys, store.actions),
  }), document.getElementById('example'))
})



var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../listener')
var TreeItem = require('./tree-item')
var SimpleBody = require('./simple-body')

var TreeView = React.createClass({
  mixins: [
    Listener(function (store, props) {
      return {
        root: store.root,
        mode: store.mode
      }
    })
  ],

  propTypes: {
    mixins: PT.array,
    body: PT.func,
  },

  componentWillMount: function () {
    this.listen('root', 'mode')
    window.addEventListener('keydown', this._onKeyDown)
  },

  getDefaultProps: function () {
    return {
      body: SimpleBody
    }
  },

  _onKeyDown: function (e) {
    if (this.state.mode !== 'normal') return
    var actions = this.props.store.actions
    switch (e.keyCode) {
      case 38:
        actions.goUp(); break
      case 39:
        actions.goRight(); break
      case 40:
        actions.goDown(); break
      case 37:
        actions.goLeft(); break
      default: return
    }
    e.preventDefault()
  },

  render: function () {
    return TreeItem({
      store: this.props.store,
      mixins: this.props.mixins,
      body: this.props.body,
      id: this.state.root
    })
  },
})

module.exports = TreeView

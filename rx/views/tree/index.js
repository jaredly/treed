/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../../listener')
var TreeItem = require('./item')
var SimpleBody = require('../body/simple')

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
    plugins: PT.array,
    nodePlugins: PT.array,
    body: PT.func,

    keys: PT.object,
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
    if (this.state.mode === 'normal') {
      return this.props.keys.normal(e)
    }
    if (this.state.mode === 'visual') {
      return this.props.keys.visual(e)
    }
    /*
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
    */
  },

  render: function () {
    var className = 'list list-' + this.state.mode
    return <div className={className}>
      {TreeItem({
        store: this.props.store,
        plugins: this.props.nodePlugins,
        keys: this.props.keys.insert,
        body: this.props.body,
        id: this.state.root
      })}
    </div>
  },
})

module.exports = TreeView

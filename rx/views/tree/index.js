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
        root: store.view.root,
        mode: store.view.mode,
        isActive: store.isActiveView(),
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
    var e = this.props.store.events
    this.listen(e.rootChanged(), e.modeChanged(), e.activeViewChanged())
    window.addEventListener('keydown', this._onKeyDown)
  },

  getDefaultProps: function () {
    return {
      body: SimpleBody
    }
  },

  _onKeyDown: function (e) {
    if (!this.state.isActive) return
    if (this.state.mode === 'normal') {
      return this.props.keys.normal(e)
    }
    if (this.state.mode === 'visual') {
      return this.props.keys.visual(e)
    }
  },

  render: function () {
    var className = 'list list-' + this.state.mode
    if (this.state.isActive) className += ' list-active'
    return <div className={className}>
      {TreeItem({
        store: this.props.store,
        plugins: this.props.nodePlugins,
        keys: this.props.keys.insert,
        body: this.props.body,
        isRoot: true,
        id: this.state.root
      })}
    </div>
  },
})

module.exports = TreeView

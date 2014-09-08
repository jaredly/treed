/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var extend = require('../../util/extend')
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

    keys: PT.object,
  },

  componentWillMount: function () {
    var e = this.props.store.events
    this.listen(e.rootChanged(), e.modeChanged(), e.activeViewChanged())
    window.addEventListener('keydown', this._onKeyDown)
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

  fromMix: function (part) {
    if (!this.props.plugins) return
    var items = []
    for (var i=0; i<this.props.plugins.length; i++) {
      var plugin = this.props.plugins[i].blocks
      if (!plugin || !plugin[part]) continue;
      items.push(plugin[part](this.props.store.actions, this.state, this.props.store))
    }
    if (!items.length) return null
    return items
  },

  render: function () {
    var className = 'list list-' + this.state.mode
    if (this.state.isActive) className += ' list-active'
    var bodies = {
      default: {editor: null, renderer: null}
    }
    if (this.props.nodePlugins) {
      for (var i=0; i<this.props.nodePlugins.length; i++) {
        if (this.props.nodePlugins[i].bodies) {
          bodies = extend(bodies, this.props.nodePlugins[i].bodies)
        }
      }
    }
    return <div className={className}>
      {this.fromMix('top')}
      {TreeItem({
        store: this.props.store,
        plugins: this.props.nodePlugins,
        keys: this.props.keys.insert,
        bodies: bodies,
        isRoot: true,
        id: this.state.root
      })}
      {this.fromMix('bottom')}
    </div>
  },
})

module.exports = TreeView

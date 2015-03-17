
var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var extend = require('../../util/extend')
var Listener = require('../../listener')
var FocusItem = require('./item')

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
    skipMix: PT.array,
  },

  getDefaultProps: function () {
    return {
      skipMix: []
    }
  },

  componentDidUpdate: function (prevProps) {
    if (this.props.store !== prevProps.store) {
      var e = this.props.store.events
      this.listen(e.rootChanged(), e.modeChanged(), e.activeViewChanged())
    }
  },

  componentWillMount: function () {
    var e = this.props.store.events
    this.listen(e.rootChanged(), e.modeChanged(), e.activeViewChanged())
  },

  fromMix: function (part) {
    if (!this.props.plugins) return
    if (this.props.skipMix.indexOf(part) !== -1) return
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
    var className = 'focus'
    if (this.state.isActive) className += ' focus-active'
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
    return FocusItem({
      store: this.props.store,
      plugins: this.props.nodePlugins,
      bodies: bodies,
      id: this.state.root
    })
  },
})

module.exports = TreeView


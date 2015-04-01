'use strict'

var React = require('react/addons')
var PT = React.PropTypes

var extend = require('../../util/extend')
var Listener = require('../../listener')
var ListItem = require('./item')

// TODO rename TreeView classes to ListView - check css, etc.
var ListView = React.createClass({
  statics: {
    keys: require('./keys'),
    actions: require('./actions'),
  },

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
    // TODO can this be factored out?
    window.addEventListener('blur', this._onBlur)
    window.addEventListener('focus', this._onFocus)
  },

  componentWillUnmount: function () {
    window.removeEventListener('blur', this._onBlur)
    window.removeEventListener('focus', this._onFocus)
  },

  _onBlur: function () {
    this.props.store.view.windowBlur = true
    // this.prev = this.props.store.view.mode
  },

  _onFocus: function () {
    this.props.store.view.windowBlur = false
    // this.props.store.actions.edit()
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
    var className = 'TreeView TreeView-' + this.state.mode
    if (this.state.isActive) className += ' TreeView-active'
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
    return <div className={className} onClick={this.props.store.actions.setActiveView.bind(this.props.store.actions)}>
      {this.fromMix('top')}
      <ListItem
        store={this.props.store}
        plugins={this.props.nodePlugins}
        bodies={bodies}
        isRoot={true}
        id={this.state.root}
      />
      {this.fromMix('bottom')}
    </div>
  },
})

module.exports = ListView

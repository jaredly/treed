
import React, {PropTypes} from 'react'
import cx from 'classnames'

import ensureInView from '../../util/ensure-in-view'
import SimpleBody from '../body/simple'
import Listener from '../../listener'

const TreeItem = React.createClass({
  propTypes: {
    id: PropTypes.string.isRequired,
    plugins: PropTypes.array,
    bodies: PropTypes.object,
    isRoot: PropTypes.bool,
  },

  mixins: [
    Listener({
      storeAttrs: function (getters, props) {
        return {
          node: getters.getNode(props.id),
          isActiveView: getters.isActiveView(),
          isActive: getters.isActive(props.id),
          isSelected: getters.isSelected(props.id),
          editState: getters.editState(props.id),
        }
      },

      initStoreState: function (state, getters, props) {
        var node = state.node
        return {
          lazyChildren: !props.isRoot && node.collapsed && node.children.length
        }
      },

      updateStoreState: function (state, getters, props) {
        var node = state.node
        return {
          lazyChildren: this.state.lazyChildren && node.collapsed
        }
      },

      shouldGetNew: function (nextProps) {
        return nextProps.id !== this.props.id || nextProps.store !== this.props.store
      },

      getListeners: function (props, events) {
        return [events.nodeChanged(props.id), events.nodeViewChanged(props.id)]
      },
    })
  ],

  componentWillMount: function () {
    // get plugin update functions
    this._plugin_updates = null
    this.props.plugins.forEach((plugin) => {
      if (!plugin.componentDidUpdate) return
      if (!this._plugin_updates) {
        this._plugin_updates = [plugin.componentDidUpdate]
      } else {
        this._plugin_updates.push(plugin.componentDidUpdate)
      }
    })
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextState !== this.state ||
      (nextProps.index !== this.props.index && nextState.isActive)
    )
  },

  componentDidMount: function () {
    if (this.state.isActive && this.state.isActiveView) {
      ensureInView(this.refs.body)
    }
  },

  /** Use to check what things are updating when */
  componentDidUpdate: function (prevProps, prevState) {
    if (this._plugin_updates) {
      this._plugin_updates.map((fn) => fn.call(this, prevProps, prevState))
    }
    if (this.state.isActive &&
        this.state.isActiveView &&
        (!prevState.isActive || prevProps.index !== this.props.index)) {
      ensureInView(this.refs.body)
    }
    if (window.DEBUG_UPDATE) {
      // DEBUG STUFF
      var n = this._node
      n.style.outline = '1px solid red'
      setTimeout(function () {
        n.style.outline = ''
      }, 200)
    }
  },
  // **/

  fromMix: function (part) {
    if (!this.props.plugins) return
    var items = []
    for (var i=0; i<this.props.plugins.length; i++) {
      var plugin = this.props.plugins[i].blocks
      if (!plugin || !plugin[part]) continue;
      items.push(plugin[part](this.state.node, this.props.store.actions, this.state, this.props.store))
    }
    if (!items.length) return null
    return items
  },

  body: function () {
    var body = this.props.bodies[this.state.node.type] || this.props.bodies.default
    var abovebody = this.fromMix('abovebody')
    var belowbody = this.fromMix('belowbody')
    const props = {
      node: this.state.node,
      isActive: this.state.isActive,
      editState: this.state.editState,
      actions: this.props.store.actions,
      store: this.props.store,
    }
    const content = body.Component ?
      <body.Component {...props} /> :
      <SimpleBody
        editor={body.editor}
        renderer={body.renderer}
        {...props}
      />
    return <div ref='body' className='TreeItem_body'>
      {abovebody}
      {content}
      {belowbody}
    </div>
  },

  _onContextMenu: function (e) {
    if (this.props.store.view.mode === 'insert' && this.state.node.id === this.props.store.view.active) return e.stopPropagation()
    e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.setActive(this.state.node.id)
    this.props.store.actions.showContextMenu(e.clientX, e.clientY, this.state.node.id)
  },

  render: function () {
    if (!this.state.node) return <span/>
    var className = cx({
      'TreeItem': true,
      'TreeItem-active': this.state.isActive,
      'TreeItem-editing': this.state.editState,
      'TreeItem-selected': this.state.isSelected,
      'TreeItem-root': this.props.isRoot,
    })
    className += ' TreeItem-type-' + this.state.node.type
    if (this.props.plugins) {
      this.props.plugins.forEach((plugin) => {
        if (!plugin.classes) return
        var classes = plugin.classes(this.state.node, this.state)
        if (classes) className += ' ' + classes
      })
    }
    return <div className={className} ref={n => this._node = n} onContextMenu={this._onContextMenu}>
      <div className='TreeItem_head'>
        {this.fromMix('left')}
        {this.body()}
        {this.fromMix('right')}
      </div>
      {this.fromMix('prechildren')}
      {this.state.node.children.length ?
      <div className='TreeItem_children' ref='children'>
        {!this.state.lazyChildren && this.state.node.children.map((id, i) =>
          <TreeItem
            plugins={this.props.plugins}
            store={this.props.store}
            bodies={this.props.bodies}
            index={i}
            key={id}
            id={id}
          />
        )}
      </div> : (
        this.props.isRoot ?
          <div className='TreeItem_nochildren' onClick={() => this.props.store.actions.createAfter(this.props.id)}>
            Click to add a child
          </div>
        : null
      )}
      {this.fromMix('bottom')}
    </div>
  }
})

module.exports = TreeItem


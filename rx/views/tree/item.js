/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../../listener')

var TreeItem = React.createClass({
  mixins: [
    Listener({
      storeAttrs: function (store, props) {
        return {
          node: store.getNode(props.id),
          isActive: store.isActive(props.id),
          isSelected: store.isSelected(props.id),
          isEditing: store.isEditing(props.id),
        }
      },

      initStoreState: function (state, store, props) {
        var node = state.node
        return {
          lazyChildren: node.collapsed && node.children.length
        }
      },

      updateStoreState: function (state, store, props) {
        var node = state.node
        return {
          lazyChildren: this.state.lazyChildren && node.collapsed
        }
      },

      shouldGetNew: function (nextProps) {
        return nextProps.id !== this.props.id
      },

      getListeners: function (props) {
        return ['node:' + props.id]
      },
    })
  ],

  componentWillMount: function () {
    this.listen('node:' + this.props.id)
  },

  propTypes: {
    id: PT.string.isRequired,
    plugins: PT.array,
    body: PT.oneOfType([PT.object, PT.func]),
    keys: PT.func,
    isRoot: PT.bool,
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextState !== this.state
    )
  },

  /** Use to check what things are updating when */
  componentDidUpdate: function () {
    var n = this.getDOMNode()
    n.style.outline = '1px solid red'
    setTimeout(function () {
      n.style.outline = ''
    }, 200)
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
    return this.props.body({
      node: this.state.node,
      keys: this.props.keys,
      isActive: this.state.isActive, // do we need this?
      isEditing: this.state.isEditing,
      actions: this.props.store.actions,
    })
  },

  render: function () {
    var className = cx({
      'list_item': true,
      'list_item-active': this.state.isActive,
      'list_item-editing': this.state.isEditing,
      'list_item-selected': this.state.isSelected,
      'list_item-root': this.props.isRoot,
    })
    if (this.props.plugins) {
      this.props.plugins.forEach((plugin) => {
        if (!plugin.classes) return
        var classes = plugin.classes(this.state.node, this.state)
        if (classes) className += ' ' + classes
      })
    }
    return <div className={className} key={this.props.id}>
      <div className='list_item_head'>
        {this.fromMix('left')}
        {this.body()}
        {this.fromMix('right')}
      </div>
      <div className='list_item_children'>
        {this.state.node.children.map((id) => 
          TreeItem({
            plugins: this.props.plugins,
            store: this.props.store,
            body: this.props.body,
            keys: this.props.keys,
            id: id,
          })
        )}
      </div>
      {this.fromMix('bottom')}
    </div>
  }
})

module.exports = TreeItem


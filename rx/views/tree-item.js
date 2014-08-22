/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../listener')

var TreeItem = React.createClass({
  mixins: [
    Listener({
      initStoreState: function (store, props) {
        var node = store.getNode(props.id)
        return {
          node: node,
          isActive: store.isActive(props.id),
          isSelected: store.isSelected(props.id),
          isEditing: store.isEditing(props.id),
          lazyChildren: node.collapsed && node.children.length
        }
      },

      updateStoreState: function (store, props) {
        var node = store.getNode(props.id)
        return {
          node: node,
          isActive: store.isActive(props.id),
          isSelected: store.isSelected(props.id),
          isEditing: store.isEditing(props.id),
          lazyChildren: this.state.lazyChildren && node.collapsed
        }
      },

      shouldGetNew: function (nextProps) {
        return nextProps.id !== this.props.id
      },
    })
  ],

  componentWillMount: function () {
    this.listen('node:' + this.props.id)
  },

  propTypes: {
    id: PT.string.isRequired,
    mixins: PT.array,
    body: PT.oneOfType([PT.object, PT.func]),
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextState !== this.state
    )
  },

  componenWillMount: function () {
    this.listen('root')
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
    if (!this.props.mixins) return
    var items = []
    for (var i=0; i<this.props.mixins.length; i++) {
      var mixin = this.props.mixins[i].blocks
      if (!mixin || !mixin[part]) continue;
      items.push(mixin[part](this.state.node, this.props.store.actions, this.state))
    }
    return items
  },

  body: function () {
    return this.props.body({
      node: this.state.node,
      isActive: this.state.isActive, // do we need this?
      isEditing: this.state.isEditing,
      actions: this.props.store.actions,
    })
  },

  render: function () {
    return <div className={cx({
      'list_item': true,
      'list_item-active': this.state.isActive,
      'list_item-selected': this.state.isSelected,
    })} key={this.props.id}>
      <div className='list_item_head'>
        {this.fromMix('left')}
        {this.body()}
        {this.fromMix('right')}
      </div>
      <div className='list_item_children'>
        {this.state.node.children.map((id) => 
          TreeItem({
            mixins: this.props.mixins,
            store: this.props.store,
            body: this.props.body,
            id: id,
          })
        )}
      </div>
      {this.fromMix('bottom')}
    </div>
  }
})

module.exports = TreeItem


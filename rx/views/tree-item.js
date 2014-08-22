/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../listener')

var TreeItem = React.createClass({
  mixins: [
    Listener(function (store, props) {
      return {
        node: store.getNode(props.id),
        isActive: store.isActive(props.id),
        isSelected: store.isSelected(props.id),
        isEditing: store.isEditing(props.id),
      }
    })
  ],

  propTypes: {
    id: PT.string.isRequired,
    mixins: PT.array,
    body: PT.object,
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextProps.id !== this.props.id ||
      nextState !== this.state
    )
  },

  componenWillMount: function () {
    this.listen('root')
  },

  fromMix: function (part) {
    var items = []
    for (var i=0; i<this.props.mixins.length; i++) {
      var mixin = this.props.mixins[i].node
      if (!mixin || !mixin[part]) continue;
      items.push(mixin[part]({
        node: this.state.node,
        actions: this.props.store.actions
      }))
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


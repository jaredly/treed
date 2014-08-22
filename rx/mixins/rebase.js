/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  id: 'rebase',
  store: {
    actions: {
      rebase: function (id, edit) {
        this.root = id
        this.active = id
        this.mode = edit ? 'insert' : 'normal'
        this.changed('root', 'active', 'mode')
      }
    },

    getPedigree: function (id, last) {
      var items = []
      var node = this.ids[id]
      if (!last) {
        node = this.ids[node.parent]
      }
      while (node) {
        items.push({
          id: node.id,
          content: node.content
        })
        node = this.ids[node.parent]
      }
    }
  },

  node: {
    left: function (props) {
      return <div className={cx({
        'm_RebaseDot': true,
        'm_RebaseDot-full': props.node.collapsed && props.node.children.length,
      })} onClick={props.actions.rebase.bind(null, props.id)}/>
    }
  }
}


/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  store: {
    actions: {
      collapse: function (id) {
        if (!this.pl.nodes[id].children.length) {
          return
        }
        this.actions.set(id, 'collapsed', true)
      },

      expand: function (id) {
        if (!this.pl.nodes[id].children.length) {
          return
        }
        this.actions.set(id, 'collapsed', false)
      },

      toggleCollapse: function (id) {
        if (!this.pl.nodes[id].children.length) {
          return
        }
        this.actions.set(id, 'collapsed', !this.pl.nodes[id].collapsed)
      },
    }
  },

  node: {
    keys: {
      normal: {
        'toggle collapse': {
          description: 'Toggle the collapse of the current item',
          bind: 'z',
        },
      },
      insert: {
        'collapse': {
          description: 'Collapse the current item',
          bind: 'ctrl+left',
        },
      },
    },

    blocks: {
      left: function (node, actions) {
        return <div className={cx({
          'm_Collapser': true,
          'm_Collapsed': node.collapsed
        })} onClick={actions.toggleCollapse.bind(null, props.id)}/>
      }
    },

  }
}


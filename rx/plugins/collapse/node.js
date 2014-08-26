/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  classes: function (node, state) {
    var cls = []
    if (node.collapsed) {
      cls.push('n_Collapse')
    }
    if (node.children.length) {
      cls.push('list_item-parent')
    }
    return cls.join(' ')
  },


  blocks: {
    left: function (node, actions) {
      return <div className={cx({
        'm_Collapser': true,
        'm_Collapser-collapsed': node.collapsed
      })} onClick={actions.toggleCollapse.bind(null, node.id)}/>
    }
  },
}


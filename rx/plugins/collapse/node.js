/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  classes: function (node, state) {
    if (node.collapsed) {
      return 'n_Collapse'
    }
  },
  blocks: {
    left: function (node, actions) {
      return <div className={cx({
        'm_Collapser': true,
        'm_Collapsed': node.collapsed
      })} onClick={actions.toggleCollapse.bind(null, node.id)}/>
    }
  },
}


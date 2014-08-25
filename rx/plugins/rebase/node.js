/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  blocks: {
    left: function (node, actions, state) {
      // TODO: movement
      return <div className={cx({
        'm_RebaseDot': true,
        'm_RebaseDot-full': node.collapsed && node.children.length,
      })}
      key='rebase'
      onClick={actions.rebase.bind(null, node.id)}/>
    }
  }
}


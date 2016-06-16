
var React = require('react')
var cx = require('classnames')

module.exports = {
  blocks: {
    abovebody: function (node, actions, state) {
      // TODO: movement
      return <div className={cx({
        'm_RebaseDot': true,
        'm_RebaseDot-full': node.collapsed && node.children.length,
      })}
      key='rebase'
      onClick={actions.rebase.bind(actions, node.id)}/>
    }
  }
}


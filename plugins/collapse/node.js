
var React = require('react/addons')
var cx = React.addons.classSet

var slide = require('../../util/slide')

module.exports = {
  classes: function (node, state) {
    var cls = []
    if (node.collapsed) {
      cls.push('n_Collapse')
    }
    if (node.children.length) {
      cls.push('TreeItem-parent')
    }
    return cls.join(' ')
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.props.isRoot) return
    if (!this.state.node) return
    var c = this.state.node.collapsed
    if (!this.refs || !this.refs.children) return
    if (this._prev_collapsed === c) return
    this._prev_collapsed = c
    var el = this.refs.children.getDOMNode()
    if (c) {
      slide.up(el)
    } else {
      slide.down(el)
    }
  },

  blocks: {
    left: function (node, actions) {
      return <div className={cx({
        'm_Collapser': true,
        'm_Collapser-collapsed': node.collapsed
      })} onClick={actions.toggleCollapse.bind(actions, node.id)}/>
    }
  },
}


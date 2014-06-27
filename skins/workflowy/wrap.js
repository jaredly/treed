
var d = React.DOM

var Wrapper = module.exports = React.createClass({
  propTypes: {
    node: React.PropTypes.object.isRequired,
  },

  componentDidMount: function () {
    this._init(this.props.node);
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.node === this.props.node) return

    if (this.props.node) {
      this._replace(nextProps.node)
    } else {
      this._init(nextProps.node)
    }
  },
  componentWillUnmount: function () {
    this._destroy()
  },

  _replace: function (node) {
    var n = this.getDOMNode()
    if (n === this.props.node.parentNode) {
      n.replaceChild(node, this.props.node)
    }
  },
  _init: function (node) {
    this.getDOMNode().appendChild(node)
  },
  _destroy: function () {
    if (!this.props.node) return
    var n = this.getDOMNode()
    if (n === this.props.node.parentNode) {
      n.removeChild(this.props.node)
    }
  },

  render: function () {
    return this.transferPropsTo(d.div({className: 'wrapper'}))
  }
})


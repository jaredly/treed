
var d = React.DOM

var Wrapper = module.exports = React.createClass({
  propTypes: {
    controller: React.PropTypes.object,
    onBullet: React.PropTypes.func,
    onBreadCrumb: React.PropTypes.func
  },

  componentDidMount: function () {
    setTimeout(function () {
      this._init(this.props);
    }.bind(this), 0)
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.controller === this.props.controller) return

    this._destroy()
    setTimeout(function () {
      this._init(nextProps)
    }.bind(this), 0)
  },

  _init: function (props) {
    this.getDOMNode().appendChild(props.controller.node)
  },
  _destroy: function () {
    if (!this.props.controller) return
    this.props.controller.node.parentNode.removeChild(this.props.controller.node)
    delete this.ctrl
  },

  render: function () {
    return d.div()
  }
})


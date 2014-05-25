
var d = React.DOM
  , Controller = require('./wf-controller')

var Workflowy = module.exports = React.createClass({
  componentDidMount: function () {
    setTimeout(function () {
      this._init(this.props);
    }.bind(this), 0)
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.model === this.props.model) return
    this._destroy()
    setTimeout(function () {
      this._init(nextProps)
    }.bind(this), 0)
  },
  _destroy: function () {
    if (!this.wf) return
    this.wf.node.parentNode.removeChild(this.wf.node)
    delete this.wf
  },
  _init: function (props) {
    this.wf = new Controller(props.model, {onBullet: props.onBreadCrumb})
    this.wf.on('rebase', function (root) {
      props.onBreadCrumb(props.model.getLineage(root))
    }.bind(this))
    this.getDOMNode().appendChild(this.wf.node)
  },
  render: function () {
    return d.div()
  }
})


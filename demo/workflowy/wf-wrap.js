
var d = React.DOM
  , Controller = require('./wf-controller')

var Workflowy = module.exports = React.createClass({
  componentDidMount: function () {
    this._init();
  },
  componentWillReceiveProps: function (props) {
    this._destroy()
    this._init(props)
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


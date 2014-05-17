
var d = React.DOM
  , Controller = require('./wf-controller')

var Workflowy = React.createClass({
  componentDidMount: function () {
    this.wf = new Controller(this.props.model, {onBullet: this.props.onBreadCrumb})
    this.wf.on('rebase', function (root) {
      this.props.onBreadCrumb(this.props.model.getLineage(root))
    }.bind(this))
    this.getDOMNode().appendChild(this.wf.node)
  },
  render: function () {
    return d.div()
  }
})


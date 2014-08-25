/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

// a more complex body would show different things based on the type of node.
var SimpleBody = React.createClass({
  _onClick: function () {
    if (this.props.isEditing) {
      this.props.actions.stopEditing(this.props.node.id)
    } else {
      this.props.actions.startEditing(this.props.node.id)
    }
  },

  render: function () {
    return <div className={cx({
      'treed_body': true
    })} onClick={this._onClick}>
      {this.props.node.content}
      {this.props.isActive && '*' }
      {this.props.isEditing && '<' }
    </div>
  }
})

module.exports = SimpleBody


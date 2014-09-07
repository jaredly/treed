/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes
var ensureInView = require('../../util/ensure-in-view')

var Textarea = require('./textarea-grow')

// a more complex body would show different things based on the type of node.
var SimpleBody = React.createClass({
  _onClick: function () {
    if (this.props.editState) {
      // this.props.actions.normalMode(this.props.node.id)
    } else {
      this.props.actions.edit(this.props.node.id)
    }
  },

  getInitialState: function () {
    return {
      content: this.props.node.content
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (!nextProps.editState && this.props.editState) {
      if (this.state.content !== this.props.node.content) {
        this.props.actions.setContent(this.props.node.id, this.state.content)
      }
    }
    this.setState({
      content: nextProps.node.content
    })
  },

  _onChange: function (e) {
    this.setState({content: e.target.value})
  },

  _onKeyDown: function (e) {
    var text = this.refs.text
      , line
      , pos
    if (e.key === 'ArrowDown') {
      line = text.getCursorLine()
      if (line === -1 || line === 1) {
        this.props.actions.goDown()
        e.preventDefault()
      }
    } else if (e.key === 'ArrowUp') {
      line = text.getCursorLine()
      if (line === 0 || line === 1) {
        this.props.actions.goUp()
        e.preventDefault()
      }
    } else if (e.key === 'ArrowRight') {
      pos = text.getCursorPos()
      if (pos === -1 || pos === 1) {
        this.props.actions.goDown(true)
        e.preventDefault()
      }
    } else if (e.key === 'ArrowLeft') {
      pos = text.getCursorPos()
      if (pos === 0 || pos === 1) {
        this.props.actions.goUp()
        e.preventDefault()
      }
    } else {
      this.props.keys(e)
    }
  },

  _onBlur: function () {
    if (this.state.content !== this.props.node.content) {
      this.props.actions.setContent(this.props.node.id, this.state.content)
    }
    this.props.actions.normalMode()
  },

  componentDidMount: function () {
    if (!this.props.editState) return
    ensureInView(this.refs.text.getDOMNode())
    if (this.props.editState === 'change') {
      this.setState({content: ''}, () => {
        this.refs.text.focus()
      })
    } else {
      this.refs.text.focus(this.props.editState === 'start')
    }
  },

  componentDidUpdate: function (prevProps) {
    if (!prevProps.editState && this.props.editState) {
      ensureInView(this.refs.text.getDOMNode())
      if (this.props.editState === 'change') {
        this.setState({content: ''}, () => {
          this.refs.text.focus()
        })
      } else {
        this.refs.text.focus(this.props.editState === 'start')
      }
    }
  },

  render: function () {
    var className = cx({
      'treed_body': true
    })
    className += ' treed_body-type-' + this.props.node.type
    return <div className={className} onClick={this._onClick}>
      {this.props.editState ?
        <Textarea
          ref="text"
          value={this.state.content}
          onChange={this._onChange}
          onBlur={this._onBlur}
          onKeyDown={this._onKeyDown}/>
        : <span className="treed_body_rendered">{this.props.node.content}</span>
      }
    </div>
  }

  // TODO marked
})

module.exports = SimpleBody


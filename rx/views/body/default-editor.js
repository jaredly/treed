
var React = require('react')
  , PT = React.PropTypes

var Textarea = require('./textarea-grow')

/**
 * The required interface, in addition to the shown props, is
 * : focus(bool atStart)
 */
var Editor = React.createClass({
  propTypes: {
    value: PT.string,
    onBlur: PT.func,
    onChange: PT.func,
    onKeyDown: PT.func,
    createAfter: PT.func,
    goDown: PT.func,
    goUp: PT.func,
  },

  componentDidMount: function () {
    this.focus()
  },

  isFocused: function () {
    return this.refs.text.isFocused()
  },

  focus: function () {
    this.refs.text.focus.apply(this.refs.text, arguments)
  },

  _onChange: function (e) {
    this.props.onChange(e.target.value)
  },

  _onKeyDown: function (e) {
    var text = this.refs.text
      , line
      , pos
    if (e.key === 'ArrowDown' && !e.shiftKey) {
      line = text.getCursorLine()
      if (line === -1 || line === 1) {
        if (this.props.goDown()) {
          e.preventDefault()
        }
      }
    } else if (e.key === 'ArrowUp' && !e.shiftKey) {
      line = text.getCursorLine()
      if (line === 0 || line === 1) {
        if (this.props.goUp()) {
          e.preventDefault()
        }
      }
    } else if (e.key === 'ArrowRight' && !e.shiftKey) {
      pos = text.getCursorPos()
      if (pos === -1 || pos === 1) {
        this.props.goDown(true)
        e.preventDefault()
      }
    } else if (e.key === 'ArrowLeft' && !e.shiftKey) {
      pos = text.getCursorPos()
      if (pos === 0 || pos === 1) {
        this.props.goUp()
        e.preventDefault()
      }
    } else if (e.key === 'Backspace') {
      if (!this.props.value.length) {
        this.props.removeEmpty()
        e.preventDefault()
      } else if (text.getCursorSplit() === 0) {
        e.preventDefault()
        this.props.joinUp(null, this.props.value)
      }
    } else if (e.key === 'Enter') {
      if (!e.shiftKey && !e.ctrlKey && !e.altKey && this.props.value.indexOf('\n') === -1) {
        text.blur()
        pos = text.getCursorSplit()
        if (pos < this.props.value.length) {
          this.props.onChange(this.props.value.slice(0, pos))
          this.props.createAfter(null, this.props.value.slice(0, pos), this.props.value.slice(pos))
        } else {
          this.props.createAfter()
        }
        e.preventDefault()
      } else if (e.ctrlKey && this.props.value.indexOf('\n') !== -1) {
        pos = text.getCursorSplit()
        if (pos < this.props.value.length) {
          this.props.onChange(this.props.value.slice(0, pos))
          this.props.createAfter(null, this.props.value.slice(0, pos), this.props.value.slice(pos))
        } else {
          this.props.createAfter()
        }
        e.preventDefault()
      }
    } else {
      return this.props.onKeyDown(e)
    }
  },

  render: function () {
    return <Textarea
      ref="text"
      value={this.props.value}
      onChange={this._onChange}
      onBlur={this.props.onBlur}
      onKeyDown={this._onKeyDown}/>
  }
})

module.exports = Editor


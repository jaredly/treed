/** @jsx React.DOM */

var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes
var ensureInView = require('../../util/ensure-in-view')
var marked = require('marked')
var Editor = require('./default-editor')

var renderer = new marked.Renderer()
renderer.link = function (href, title, text) {
  return '<a href="' + href + '" target="_blank" title="' + title + '">' + text + '</a>';
}

marked.setOptions({
  gfm: true,
  sanitize: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  renderer: renderer
})

// a more complex body would show different things based on the type of node.
var SimpleBody = React.createClass({
  _onClick: function () {
    if (this.props.editState) {
      // this.props.actions.normalMode(this.props.node.id)
    } else {
      this.props.actions.edit(this.props.node.id)
    }
  },

  getDefaultProps: function () {
    return {
      renderer: null,
      editor: null,
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

  _onChange: function (value) {
    this.setState({content: value})
  },

  _onKeyDown: function (e) {
    this.props.keys(e)
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

  editor: function () {
    var Ctrl = this.props.editor || Editor
    return <Ctrl
      ref="text"
      value={this.state.content}
      node={this.props.node}
      goDown={this.props.actions.goDown.bind(this.props.actions)}
      goUp={this.props.actions.goUp.bind(this.props.actions)}
      createAfter={this.props.actions.createAfter.bind(this.props.actions)}
      removeEmpty={this.props.actions.removeEmpty.bind(this.props.actions)}
      onChange={this._onChange}
      onBlur={this._onBlur}
      onKeyDown={this._onKeyDown}/>
        /*
      return <Textarea
        ref="text"
        value={this.state.content}
        onChange={this._onChange}
        onBlur={this._onBlur}
        onKeyDown={this._onKeyDown}/>
        */
  },

  renderer: function () {
    if (!this.props.renderer) {
      return <span className="treed_body_rendered"
        onClick={this._onClick}
        dangerouslySetInnerHTML={{
          __html: this.props.node.content ?
                    marked(this.props.node.content + '') : ''
        }}/>
    }
    return this.props.renderer.call(this)
  },

  render: function () {
    var className = cx({
      'treed_body': true
    })
    className += ' treed_body-type-' + this.props.node.type
    return <div className={className}>
      {this.props.editState ? this.editor() : this.renderer()}
    </div>
  }

  // TODO marked
})

module.exports = SimpleBody


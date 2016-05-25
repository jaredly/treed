
import {findDOMNode} from 'react-dom'
var React = require('react/addons')
  , cx = require('classnames')
  , PT = React.PropTypes
  , ensureInView = require('../../util/ensure-in-view')
  , DefaultEditor = require('./default-editor')
  , DefaultRenderer = require('./default-renderer')

// a more complex body would show different things based on the type of node.
var SimpleBody = React.createClass({
  propTypes: {
    editor: PT.func,
    renderer: PT.func,
    node: PT.object,
    isActive: PT.bool,
    editState: PT.oneOfType([PT.string, PT.bool]),
    actions: PT.object,
    store: PT.object,
  },

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

  _onBlur: function () {
    if (this.state.content !== this.props.node.content) {
      this.props.actions.setContent(this.props.node.id, this.state.content)
    }
    setTimeout(() => {
      if (this.isMounted() && !this.props.store.view.windowBlur &&
          this.props.isActive && this.refs.text &&
          (this.refs.text.isFocused && !this.refs.text.isFocused())) {
        this.props.actions.normalMode()
      }
    }, 80)
  },

  _onContextMenu: function (e) {
    if (this.props.store.view.mode === 'insert' && this.props.node.id === this.props.store.view.active) return
    this.props.actions.setActive(this.props.node.id)
    this.props.actions.showContextMenu(e.clientX, e.clientY, this.props.node.id)
    e.preventDefault()
    e.stopPropagation()
  },

  componentDidMount: function () {
    if (!this.props.editState) return
    ensureInView(findDOMNode(this.refs.text))
    this.refs.text.focus(this.props.editState)
  },

  componentDidUpdate: function (prevProps) {
    if (!prevProps.editState && this.props.editState) {
      ensureInView(findDOMNode(this.refs.text))
      this.refs.text.focus(this.props.editState)
    }
  },

  editor: function () {
    var Ctrl = this.props.editor || props => <DefaultEditor {...props} />
    const props = {
      ref: "text",
      value: this.state.content,
      node: this.props.node,
      store: this.props.store,
      goDown: this.props.actions.goDown.bind(this.props.actions),
      goUp: this.props.actions.goUp.bind(this.props.actions),
      joinUp: this.props.actions.joinUp.bind(this.props.actions),
      createAfter: this.props.actions.createAfter.bind(this.props.actions),
      removeEmpty: this.props.actions.removeEmpty.bind(this.props.actions),
      onChange: this._onChange,
      onBlur: this._onBlur
    }
    if (Ctrl.isReactLegacyFactory) {
      return <Ctrl {...props}/>
    }
    return Ctrl(props)
  },

  renderer: function () {
    if (!this.props.renderer) {
      return <DefaultRenderer onClick={this._onClick} content={this.props.node.content}/>
    }
    return this.props.renderer.call(this)
  },

  render: function () {
    var className = cx({
      'treed_body': true
    })
    className += ' treed_body-type-' + this.props.node.type
    var child = this.props.editState ? this.editor() : this.renderer() 
    return <div className={className} onContextMenu={this._onContextMenu}>
      {child}
    </div>
  }
})

module.exports = SimpleBody


var React = require('react/addons')
var cx = require('classnames')
var PT = React.PropTypes

var FlexPanes = React.createClass({
  propTypes: {
    flex: PT.object,
    onChange: PT.func.isRequired,
    main: PT.node,
    second: PT.node,
  },

  getInitialState: function () {
    return {
      moving: false,
      tmpSize: this.props.flex.size,
    }
  },
  _startDrag: function (e) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({dragging: true})
  },
  _onDrag: function (e) {
    var second = this.refs.second.getBoundingClientRect()
    this.setState({
      tmpSize: this.props.flex.pos === 'bottom' ?
        second.bottom - e.clientY :
        second.right - e.clientX,
    })
  },
  _endDrag: function () {
    var data = this.props.flex
    data.size = this.state.tmpSize
    this.setState({
      dragging: false,
    }, () => this.props.onChange(data))
  },
  componentWillReceiveProps: function (props) {
    if (props.flex.size !== this.props.flex.size) {
      this.setState({tmpSize: props.flex.size})
    }
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (!prevState.dragging && this.state.dragging) {
      parent.addEventListener('mousemove', this._onDrag)
      parent.addEventListener('mouseup', this._endDrag)
    } else if (prevState.dragging && !this.state.dragging) {
      parent.removeEventListener('mousemove', this._onDrag)
      parent.removeEventListener('mouseup', this._endDrag)
    }
  },
  _switch: function () {
    var data = this.props.flex
    data.pos = data.pos === 'bottom' ? 'side' : 'bottom'
    this.props.onChange(data)
  },

  render: function () {
    var bottom = this.props.flex.pos === 'bottom'
      , secondStyle = {
          overflow: 'auto',
        }
    secondStyle[bottom ? 'height' : 'width'] = this.state.tmpSize
    return <div className={'flex-panes flex-panes-' + (bottom ? 'horiz' : 'vert')}
      style={{
        flexDirection: bottom ? 'column' : 'row',
      }}>
      <div className='flex-main'>{this.props.main}</div>
        <div className='flex-bar' onMouseDown={this._startDrag}>
        <div className='flex-switch'
          onClick={this._switch}
          onMouseDown={(e) => e.stopPropagation()}/>
      </div>
      <div ref="second" className='flex-second'
        style={secondStyle}>{this.props.second}</div>
    </div>
  }
})

module.exports = FlexPanes

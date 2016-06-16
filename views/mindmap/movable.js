var React = require('react')
  , cx = require('classnames')
  , PT = React.PropTypes

  , Listener = require('../../listener')
  , MindmapLinks = require('./links')
  , MindmapNode = require('./node')

var Movable = React.createClass({
  propTypes: {
    positions: PT.object,
  },

  mixins: [
    Listener({
      storeAttrs: function (getters, props) {
        return {
          activeNode: getters.getActive(),
        }
      },
      shouldGetNew: false,
      getListeners: function (props, events) {
        return [events.activeNodeChanged()]
      },
      updateStoreState: function (state, getters, props) {
        if (this.state.activeNode === state.activeNode) return
        var aid = state.activeNode
          , pos = props.positions.boxes[aid]
        if (!pos) return
        var nx = this.state.left + pos.x
          , ny = this.state.top + pos.y
          , margin = 30
          , dx = 0
          , dy = 0
        if (nx - margin < 0) {
          dx -= nx - margin
        }
        if (ny - margin < 0) {
          dy -= ny - margin
        }
        if (nx + pos.width + margin > this.props.width) {
          dx -= nx + pos.width + margin - this.props.width
        }
        if (ny + pos.height + margin > this.props.height) {
          dy -= ny + pos.height + margin - this.props.height
        }
        return {
          left: this.state.left + dx,
          top: this.state.top + dy,
        }
      },
    })
  ],

  componentWillReceiveProps: function (nextProps) {
    var aid = this.state.activeNode
      , pos = nextProps.positions.boxes[aid]
    if (!pos) return
    var nx = this.state.left + pos.x
      , ny = this.state.top + pos.y
      , margin = 30
      , dx = 0
      , dy = 0
    if (nx - margin < 0) {
      dx -= nx - margin
    }
    if (ny - margin < 0) {
      dy -= ny - margin
    }
    if (nx + pos.width + margin > this.props.width) {
      dx -= nx + pos.width + margin - this.props.width
    }
    if (ny + pos.height + margin > this.props.height) {
      dy -= ny + pos.height + margin - this.props.height
    }
    this.setState( {
      left: this.state.left + dx,
      top: this.state.top + dy,
    })
    /*
    var aid = this.props.store.view.active
      , ppos = this.props.positions.boxes[aid]
      , npos = nextProps.positions.boxes[aid]
    if (!ppos || !npos) return
    var dx = ppos.x - npos.x
      , dy = ppos.y - npos.y
      , nx = this.state.left + dx + npos.x
      , ny = this.state.top + dy + npos.y
    if (nx < 0) {
      dx -= nx
    }
    if (ny < 0) {
      dy -= ny
    }
    this.setState({
      left: this.state.left + dx,
      top: this.state.top + dy,
    })
    */
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (!prevState.moving && this.state.moving) {
      window.addEventListener('mousemove', this._onMouseMove)
      window.addEventListener('mouseup', this._onMouseUp)
    } else if (prevState.moving && !this.state.moving) {
      window.removeEventListener('mousemove', this._onMouseMove)
      window.removeEventListener('mouseup', this._onMouseUp)
    }
  },

  _onMouseUp: function () {
    this.setState({moving: false})
  },

  _onMouseDown: function (e) {
    if (e.target !== this._node) return
    // e.preventDefault()
    e.stopPropagation()
    this.props.store.actions.setActiveView()
    this.props.store.actions.normalMode()
    this.setState({moving: {
      x: this.state.left - e.clientX,
      y: this.state.top - e.clientY,
    }})
  },

  _onMouseMove: function (e) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({
      left: e.clientX + this.state.moving.x,
      top: e.clientY + this.state.moving.y,
    })
  },

  getInitialState: function () {
    return {
      top: 0,
      left: 0,
      moving: false,
    }
  },

  render: function () {
    var style = {
      top: this.state.top,
      left: this.state.left,
      // transform: 'translate(' + this.state.left + 'px, ' + this.state.top + 'px)'
    }
    if (this.state.moving) style.transition = 'none'
    var positions = this.props.positions
    return <div
        ref={n => this._node = n}
        onMouseDown={this._onMouseDown}
        className='MindmapMovable'>
      <div
        style={style}
        className="MindmapMovable_container">
        <MindmapNode
          px={0}
          py={0}
          reCalc={this.props.reCalc}
          onHeight={this.props.onHeight}
          positions={positions.boxes}
          plugins={this.props.nodePlugins}
          bodies={this.props.bodies}
          store={this.props.store}
          key={this.props.store.view.root}
          id={this.props.store.view.root}
          isRoot={true}
          index={0}
          />
      </div>
    </div>
  },
})

module.exports = Movable

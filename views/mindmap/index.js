var React = require('react/addons')
  , cx = React.addons.classSet
  , PT = React.PropTypes

  , Listener = require('../../listener')
  , calcPos = require('./calcpos')
  , MindmapLinks = require('./links')
  , MindmapNode = require('./node')

var Mindmap = React.createClass({
  getDefaultProps: function () {
    return {width: 800, height: 800}
  },

  mixins: [
    Listener({
      storeAttrs: function (store, props) {
        return {
          root: store.view.root,
          // mode: store.view.mode,
          isActive: store.isActiveView(),
        }
      },
      getListeners: function (props, events) {
        return [
          events.rootChanged(),
          // events.modeChanged(),
          events.activeViewChanged(),
          events.changed(),
        ]
      },
    })
  ],

  propTypes: {
    plugins: PT.array,
    nodePlugins: PT.array,
    skipMix: PT.array,
    width: PT.number,
    height: PT.number,
  },

  getInitialState: function () {
    return {heights: {}}
  },

  _onHeight: function (id, height) {
    if (height == this.state.heights[id]) return
    this.state.heights[id] = height
    this.setState({heights: this.state.heights})
  },

  _reCalc: function () {
    this.forceUpdate()
  },

  calcPositions: function () {
    var positions = calcPos(
      this.props.store.view.root,
      this.props.store.actions.db.nodes,
      100,
      100,
      this.state.heights);
    return positions
  },

  render: function () {
    var positions = this.calcPositions()
    return <div className='Mindmap'>
      <Movable
        height={this.props.height}
        width={this.props.width}
        positions={positions}
        reCalc={this._reCalc}
        onHeight={this._onHeight}
        plugins={this.props.nodePlugins}
        store={this.props.store}
        />
    </div>
  },
})

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
          , nx = this.state.left + pos.x
          , ny = this.state.top + pos.y
          , margin = 100
          , dx = 0
          , dy = 0
        if (nx - margin < 0) {
          dx -= nx - margin
        }
        if (ny - margin < 0) {
          dy -= ny - margin
        }
        if (nx + pos.height + margin > this.props.width) {
          dx -= nx + pos.height + margin - this.props.width
        }
        if (ny + pos.width + margin > this.props.height) {
          dy -= ny + pos.width + margin - this.props.height
        }
        this.setState({
          left: this.state.left + dx,
          top: this.state.top + dy,
        })
      },
    })
  ],

  componentWillReceiveProps: function (nextProps) {
    var aid = this.props.store.view.active
      , ppos = this.props.positions.boxes[aid]
      , npos = nextProps.positions.boxes[aid]
      , dx = ppos.x - npos.x
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
    if (e.target !== this.getDOMNode()) return
    e.preventDefault()
    e.stopPropagation()
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
        onMouseDown={this._onMouseDown}
        className='MindmapMovable'>
      <div
        style={style}
        className="MindmapMovable_container">
        <div className='Mindmap_links'>
          <MindmapLinks
            width={positions.height + 100}
            height={positions.width}
            top={this.state.top}
            left={this.state.left}
            links={positions.links}/>
        </div>
      <MindmapNode
        px={0}
        py={0}
        reCalc={this.props.reCalc}
        onHeight={this.props.onHeight}
        positions={positions.boxes}
        plugins={this.props.nodePlugins}
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

module.exports = Mindmap


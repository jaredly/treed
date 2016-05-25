var React = require('react/addons')
  , cx = require('classnames')
  , PT = React.PropTypes

  , Listener = require('../../listener')
  , calcPos = require('./calcpos')
  , Movable = require('./movable')
  , extend = require('../../util/extend')

var Mindmap = React.createClass({
  statics: {
    keys: require('./keys'),
    actions: require('./actions'),
  },

  getDefaultProps: function () {
    // TODO get this value from the container
    return {width: 1200, height: 800}
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
      20,
      100,
      250,
      this.state.heights);
    return positions
  },

  render: function () {
    var positions = this.calcPositions()
    var bodies = {
      default: {editor: null, renderer: null}
    }
    if (this.props.nodePlugins) {
      for (var i=0; i<this.props.nodePlugins.length; i++) {
        if (this.props.nodePlugins[i].bodies) {
          bodies = extend(bodies, this.props.nodePlugins[i].bodies)
        }
      }
    }
    var {height, width} = this.props
    if (this.isMounted()) {
      var box = this._node.getBoundingClientRect()
      height = box.height
      width = box.width
    }
    return <div className={cx({
        'Mindmap': true,
        'Mindmap-active': this.state.isActive,
    })} ref={n => this._node = n}>
      <Movable
        height={height}
        width={width}
        bodies={bodies}
        positions={positions}
        reCalc={this._reCalc}
        onHeight={this._onHeight}
        plugins={this.props.nodePlugins}
        store={this.props.store}
        />
    </div>
  },
})

module.exports = Mindmap


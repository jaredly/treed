var React = require('react/addons')
  , cx = React.addons.classSet
  , PT = React.PropTypes

  , Listener = require('../../listener')
  , calcPos = require('./calcpos')

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

  calcPositions: function () {
    var positions = calcPos(this.props.store.view.root, this.props.store.actions.db.nodes, this.props.height, this.props.width, 0, 50);
    return positions
  },

  render: function () {
    var positions = this.calcPositions()
    return <div className='Mindmap'>
      <div className='Mindmap_links'>
        <MindmapLinks width={this.props.width} height={this.props.height} links={positions.links}/>
      </div>
      <MindmapNode
        positions={positions.boxes}
        plugins={this.props.nodePlugins}
        store={this.props.store}
        id={this.props.store.view.root}
        index={0}
        isRoot={true}
        key={this.props.store.view.root}
        />
    </div>
  },
})

var MindmapLinks = React.createClass({
  componentDidMount: function () {
    this._render()
  },
  componentDidUpdate: function () {
    this._render()
  },
  _render: function () {
    var ctx = this.getDOMNode().getContext('2d')
    ctx.strokeStyle='red'
    ctx.lineWidth = 10
    this.props.links.forEach(link => {
      ctx.beginPath()
      ctx.moveTo(link.y1, link.x1)
      ctx.lineTo(link.y2, link.x2)
      ctx.stroke()
    })
  },
  render() {
    return <canvas width={this.props.width} height={this.props.height}/>
  }
})

var MindmapNode = React.createClass({
  mixins: [
    Listener({
      storeAttrs: function (getters, props) {
        return {
          node: getters.getNode(props.id),
          isActiveView: getters.isActiveView(),
          isActive: getters.isActive(props.id),
          isSelected: getters.isSelected(props.id),
          editState: getters.editState(props.id),
        }
      },

      initStoreState: function (state, getters, props) {
        var node = state.node
        return {
          lazyChildren: !props.isRoot && node.collapsed && node.children.length
        }
      },

      updateStoreState: function (state, getters, props) {
        var node = state.node
        return {
          lazyChildren: this.state.lazyChildren && node.collapsed
        }
      },

      shouldGetNew: function (nextProps) {
        return nextProps.id !== this.props.id || nextProps.store !== this.props.store
      },

      getListeners: function (props, events) {
        return [events.nodeChanged(props.id), events.nodeViewChanged(props.id)]
      },
    })
  ],

  render: function () {
    var box = this.props.positions[this.props.id]
    var style = {
      top: box.x,
      left: box.y,
      width: box.height,
      height: box.width,
    }
    return <div style={style} className='MindmapNode'>
      <div className='MindmapNode_main'>
        {this.state.node.content}
      </div>
      {this.state.node.children.length ? <div className='MindmapNode_children'>
        {!this.state.lazyChildren && this.state.node.children.map((id, i) =>
          <MindmapNode
            positions={this.props.positions}
            plugins={this.props.plugins}
            store={this.props.store}
            bodies={this.props.bodies}
            index={i}
            key={id}
            id={id} />
        )}
      </div> : null}
    </div>
  },
})

module.exports = Mindmap


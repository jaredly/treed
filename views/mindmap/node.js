var React = require('react/addons')
  , cx = React.addons.classSet
  , PT = React.PropTypes
  , SimpleBody = require('../body/simple')

  , Listener = require('../../listener')

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
          lazyChildren: !props.isRoot && node.collapsed && node.children.length,
          collapsed: node.collapsed,
        }
      },

      updateStoreState: function (state, getters, props) {
        var node = state.node
        return {
          lazyChildren: this.state.lazyChildren && node.collapsed,
          collapsed: node.collapsed,
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

  getInitialState: function () {
    return {ticked: false}
  },

  componentDidMount: function () {
    this.props.onHeight(this.props.id, this.getDOMNode().getBoundingClientRect().height)
    this.setState({ticked: true})
  },

  componentDidUpdate: function (prevProps, prevState) {
    this.props.onHeight(this.props.id, this.getDOMNode().getBoundingClientRect().height)
    if (this.state.collapsed !== prevState.collapsed) {
      this.props.reCalc()
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return nextProps.id !== this.props.id || nextState !== this.state || nextProps.positions !== this.props.positions
  },

  _onClick: function () {
    this.props.store.actions.edit(this.props.id)
  },

  _toggleCollapse: function () {
    this.props.store.actions.toggleCollapse(this.props.id)
  },

  makeLine: function () {
    if (this.props.isRoot) return
    var box
    if (this.state.ticked) {
      box = this.props.positions[this.props.id]
    }
    if (!box) {
      box = {x: this.props.px, y: this.props.py}
    }
    var x = this.props.px - box.x
      , y = this.props.py - box.y
      , length = Math.sqrt(x*x + y*y)
      , ang = length ? Math.atan2(y, x) : Math.PI
    if (ang < 0) ang += Math.PI*2
    style = {
      width: length,
      transform: `rotate(${ang}rad)`,
    }
    return <div className='MindmapNode_line' style={style}/>
  },

  render: function () {
    var box
    if (this.state.ticked) {
      box = this.props.positions[this.props.id]
    } 
    if (!box) {
      box = {x: this.props.px, y: this.props.py}
    }
    var style = {
      transform: 'translate(' + (box.x - this.props.px) + 'px, ' + (box.y - this.props.py) + 'px)',
      opacity: (this.props.hiding || !this.state.ticked) ? 0 : 1,
    }
    var cls = cx({
      'MindmapNode': true,
      'MindmapNode-hiding': this.props.hiding,
      'MindmapNode-active': this.state.isActive,
      'MindmapNode-editing': this.state.editState,
      'MindmapNode-parent': this.state.node.children && this.state.node.children.length,
      'MindmapNode-collapsed': this.state.node.children && this.state.node.children.length && this.state.node.collapsed,
    })
    var body = this.props.bodies[this.state.node.type] || this.props.bodies['default']
    return <div style={style} className={cls}>
      {this.makeLine()}
      <div onClick={this._onClick} className='MindmapNode_main'>
        <div className='MindmapNode_collapser' onClick={this._toggleCollapse}/>
        {SimpleBody({
          editor: body.editor,
          renderer: body.renderer,
          node: this.state.node,
          isActive: this.state.isActive,
          editState: this.state.editState,
          actions: this.props.store.actions,
          store: this.props.store,
        })}
      </div>
      {this.state.node.children.length ? <div className='MindmapNode_children'>
        {!this.state.lazyChildren && this.state.node.children.map((id, i) =>
          <MindmapNode
            px={box.x}
            py={box.y}
            hiding={this.props.hiding || this.state.node.collapsed}
            onHeight={this.props.onHeight}
            reCalc={this.props.reCalc}
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

module.exports = MindmapNode

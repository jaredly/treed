
var React = require('react')
var cx = require('classnames')
var PT = React.PropTypes
var SimpleBody = require('../body/simple')
var FlexPanes = require('./flex-panes')

var Listener = require('../../listener')

var FocusItem = React.createClass({
  mixins: [
    Listener({
      storeAttrs: function (getters, props) {
        return {
          node: getters.getNode(props.id),
          isActiveView: getters.isActiveView(),
          editState: getters.editState(props.id),
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

  componentWillMount: function () {
    // get plugin update functions
    this._plugin_updates = null
    this.props.plugins.forEach((plugin) => {
      if (!plugin.componentDidUpdate) return
      if (!this._plugin_updates) {
        this._plugin_updates = [plugin.componentDidUpdate]
      } else {
        this._plugin_updates.push(plugin.componentDidUpdate)
      }
    })
  },

  propTypes: {
    id: PT.string.isRequired,
    plugins: PT.array,
    bodies: PT.object,
    isRoot: PT.bool,
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextState !== this.state ||
      (nextProps.index !== this.props.index && nextState.isActive)
    )
  },

  /** Use to check what things are updating when */
  componentDidUpdate: function (prevProps, prevState) {
    if (this._plugin_updates) {
      this._plugin_updates.map((fn) => fn.call(this, prevProps, prevState))
    }
  },
  // **/

  fromMix: function (part) {
    if (!this.props.plugins) return
    var items = []
    for (var i=0; i<this.props.plugins.length; i++) {
      var plugin = this.props.plugins[i].blocks
      if (!plugin || !plugin[part]) continue;
      items.push(plugin[part](this.state.node, this.props.store.actions, this.state, this.props.store))
    }
    if (!items.length) return null
    return items
  },

  body: function () {
    var body = this.props.bodies[this.state.node.type] || this.props.bodies['default']
    return <div ref='body' className='focus_item_body' style={{flex: 1}}>
      {<SimpleBody
        editor={body.editor}
        renderer={body.renderer}
        node={this.state.node}
        isActive={true}
        editState={this.state.editState}
        actions={this.props.store.actions}
        store={this.props.store}
      />}
    </div>
  },

  _onChange: function (focus) {
    this.props.store.actions.set(this.props.id, 'focus', focus)
  },

  render: function () {
    var className = cx({
      'focus': true,
      'focus-actove': this.state.isActiveView,
      'focus-editing': this.state.editState,
    })
    className += ' focus_item-type-' + this.state.node.type
    if (this.props.plugins) {
      this.props.plugins.forEach((plugin) => {
        if (!plugin.classes) return
        var classes = plugin.classes(this.state.node, this.state)
        if (classes) className += ' ' + classes
      })
    }
    var body = this.body()
    var focusPane = this.fromMix('focus-pane')
    if (!focusPane) {
      return <div className={className}>{body}</div>
    }
    var focus = this.state.node.focus || {pos: 'bottom', size: 300}
    return <FlexPanes
      onChange={this._onChange}
      flex={focus}
      main={body}
      second={focusPane}/>
  }
})

module.exports = FocusItem




var React = require('react')
var cx = require('classnames')
var PT = React.PropTypes
var ensureInView = require('../../util/ensure-in-view')
var SimpleBody = require('../body/simple')

var Listener = require('../../listener')

var TableOfContents = React.createClass({
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
  },

  propTypes: {
    id: PT.string.isRequired,
    keys: PT.func,
    isRoot: PT.bool,
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      nextState !== this.state ||
      (nextProps.index !== this.props.index && nextState.isActive)
    )
  },

  render: function () {
    // only normal nodes can be in the TOC currently
    if (!this.state.node.children.length) return null

    var children = <ul className='toc_item_children' ref='children'>
      {this.state.node.children.map((id, i) => 
        TableOfContents({
          store: this.props.store,
          keys: this.props.keys,
          index: i,
          key: id,
          id: id,
        })
      )}
    </ul>

    if (this.props.root) {
      return <div className='toc'>
        <h1>{this.state.node.content}</h1>
        {children}
      </div>
    }

    return <li className='toc_item'>
      <div className='toc_item_head'>
        <a href={'#' + this.state.node.id}>
          {this.state.node.content}
        </a>
      </div>
      {children}
    </li>
  }
})

module.exports = TableOfContents




var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes
var marked = require('marked')
var Listener = require('../../listener')

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
  smartLists: true,
  smartypants: true,
  renderer: renderer
})

var PaperItem = React.createClass({
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

  /** Use to check what things are updating when */
  componentDidUpdate: function (prevProps, prevState) {
    if (this._plugin_updates) {
      this._plugin_updates.map((fn) => fn.call(this, prevProps, prevState))
    }
  },

  /*
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
  */

  header: function () {
    switch (this.props.depth) {
      case 0:
        return <h1>{this.state.node.content}</h1>
      case 1:
        return <h2>{this.state.node.content}</h2>
      case 2:
        return <h3>{this.state.node.content}</h3>
      case 3:
        return <h4>{this.state.node.content}</h4>
      default:
        return <h5>{this.state.node.content}</h5>
    }
  },

  render: function () {
    if (this.state.node.children.length) {
      var children = this.state.node.children.map((id, i) =>
        PaperItem({
          depth: this.props.depth + 1,
          plugins: this.props.plugins,
          store: this.props.store,
          bodies: this.props.bodies,
          index: i,
          key: id,
          id: id,
        }))
      return <div className='section'>
        {this.header()}
        {children}
      </div>
    }
    var content = this.state.node.content
    if (!content) return <p/>
    if (this.state.node.type === 'ipython') {
      content = '```\n' + content + '\n```'
    }
    return <p dangerouslySetInnerHTML={{
      __html: marked(content)
    }}/>
  },

})

module.exports = PaperItem

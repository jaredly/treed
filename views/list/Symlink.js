const React = require('react')
const {css, StyleSheet} = require('aphrodite')
const SimpleBody = require('../body/simple')
const Listener = require('../../listener')

const Symlink = module.exports = React.createClass({
  mixins: [
    Listener({
      storeAttrs(getters, props) {
        return {
          real: getters.getNode(props.node.content),
        }
      },

      getListeners(props, events) {
        return [events.nodeChanged(props.node.content), events.nodeViewChanged(props.node.contents)]
      },

      shouldGetNew(nextProps) {
        return nextProps.node.content !== this.props.node.content
      },
    }),
  ],

  fromMix: function (part) {
    if (!this.props.plugins) return
    var items = []
    for (var i=0; i<this.props.plugins.length; i++) {
      var plugin = this.props.plugins[i].blocks
      if (!plugin || !plugin[part]) continue;
      items.push(plugin[part](this.state.real, this.props.store.actions, this.state, this.props.store))
    }
    if (!items.length) return null
    return items
  },

  render() {
    const real = this.state.real
    if (!real) return <div>Broken symlink</div>
    if (real.type === 'symlink')
      return <div>Nested symlinks are *not* allowed</div>

    var body = this.props.bodies[real.type] || this.props.bodies.default
    return <div className='TreeItem_head'>
      {this.fromMix('left')}
      <div ref={this.props.onBodyEl} className={'TreeItem_body ' + css(real.type === 'todo' && styles.row)}>
        {this.fromMix('abovebody')}
        <div className={css(styles.symlink)}>
          <SimpleBody
            {...this.props}
            node={real}
            editor={body.editor}
            renderer={body.renderer}
          />
        </div>
        {this.fromMix('belowbody')}
      </div>
      {this.fromMix('right')}
    </div>
  },
})

const styles = StyleSheet.create({
  symlink: {
    boxShadow: '2px 0 0 #4bbaff',
    flex: 1,
    // color: '#4bbaff',
    // fontStyle: 'italic',
    // padding: '5px 7px 3px',
  },

  row: {
    display: 'flex',
    alignItems: 'center',
  },
})


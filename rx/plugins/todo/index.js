
var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  types: {
    todo: {
      shortcut: 't',
      keys: {
        'toggle done': {
          normal: 'alt+enter',
          insert: 'alt+enter',
          visual: 'alt+enter',
        },
      },
    },
  },

  store: {
    actions: {
      toggleDone: function (id) {
        if (!arguments.length) id = this.view.active
        if (this.view.mode === 'visual') {
          this.batchSet('done', this.view.selected,
                                this.view.selected.map((id) => !this.db.nodes[id].done))
        } else {
          var done = this.db.nodes[id].done
          this.set(id, 'done', !done)
        }
      },
    },
  },

  node: {
    classes: function (node, state) {
      if (node.type !== 'todo') return
      return node.done ? 'n_Done' : ''
    },

    blocks: {
      abovebody: function (node, actions) {
        if (node.type !== 'todo') return
        return <div className={cx({
          'm_Todo': true,
          'm_Todo-done': node.done,
        })} onClick={actions.toggleDone.bind(actions, node.id)}/>
      }
    },
  },
}


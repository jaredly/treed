
var React = require('react/addons')
var cx = React.addons.classSet

module.exports = {
  title: 'To-Do Items',

  types: {
    todo: {
      shortcut: 't',
      title: 'Todo',
      description: 'A to-do item',
    },
  },

  keys: {
    'toggle todo done': {
      type: 'todo',
      normal: 'alt+enter',
      insert: 'alt+enter',
      visual: 'alt+enter',
    },
  },

  store: {
    actions: {
      toggleTodoDone: function (id) {
        if (!arguments.length) id = this.view.active
        if (this.db.nodes[id].type !== 'todo') return
        if (this.view.mode === 'visual') {
          this.setMany('done', this.view.selection,
                                this.view.selection.map((id) => !this.db.nodes[id].done))
        } else {
          this.set(id, 'done', !this.db.nodes[id].done)
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
        })} key="todo" onClick={actions.toggleTodoDone.bind(actions, node.id)}/>
      }
    },
  },
}


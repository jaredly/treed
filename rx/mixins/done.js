
module.exports = {
  store: {
    actions: {
      setDone: function (id, isDone) {
        this.actions.set(id, 'done', isDone)
      },
      toggleActiveDone: function () {
        this.actions.set(this.active, 'done', !this.pl.nodes[this.active].done)
      },
      toggleSelectedDone: function () {
        this.actions.batchSet('done', this.selected, this.selected.map((id) => !this.pl.nodes[id].done))
      },
    }
  },

  node: {
    keys: {
      normal: {
        'toggle active done': {
          description: 'Toggle the "complete" state of the current item',
          bind: 'ctrl+return'
        },
      },

      insert: {
        'toggle active done': {
          description: 'Toggle the "complete" state of the current item',
          bind: 'ctrl+return'
        },
      },

      visual: {
        'toggle selected done': {
          description: 'Toggle the "complete" state of the selected items',
          bind: 'ctrl+return'
        },
      }
    },
  }
}


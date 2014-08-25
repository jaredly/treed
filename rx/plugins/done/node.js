
module.exports = {
  classes: function (props, state) {
    return {
      'm_Done': state.node.done
    }
  },

  blocks: {
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


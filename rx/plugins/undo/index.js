
module.exports = {
  keys: {
    'undo': {
      normal: 'u, ctrl+z',
      insert: 'ctrl+z',
      visual: 'u, ctrl+z',
    },
    'redo': {
      normal: 'shift+r, ctrl+shift+z',
      insert: 'ctrl+shift+z',
      visual: 'shift+r, ctrl+shift+z',
    },
  },

  store: {
    actions: function () {
      undo: function () {
        this.undoCommands()
      },
      redo: function () {
        this.redoCommands()
      },
    },
  }
}


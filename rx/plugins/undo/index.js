
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
    actions: {
      undo: function () {
        this.parent.cmd.undoCommands()
      },
      redo: function () {
        this.parent.cmd.redoCommands()
      },
    },
  }
}


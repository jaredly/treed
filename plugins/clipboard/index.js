
var movement = require('../../views/list/movement')

module.exports = {
  title: 'Clipboard',

  keys: {
    'remove': {}, // not using this
    'cut': {
      'normal': 'd d, shift+d, ctrl+x, delete',
      'visual': 'd, shift+d, ctrl+x, delete',
      // 'insert': 'ctrl+x',
    },
    'copy': {
      'normal': 'y y, shift+y, ctrl+c',
      'visual': 'y, shift+y, ctrl+c',
      // 'insert': 'ctrl+c',
    },
    'paste': {
      'normal': 'p, ctrl+v',
      'visual': 'p, ctrl+v',
      // 'insert': 'ctrl+v',
    },
    'paste above': {
      'normal': 'shift+p',
      'visual': 'shift+p',
    },
  },

  contextMenu: function (node, store) {
    var plural = store.view.mode === 'visual' && store.view.selection.length > 1
      , nodeText = plural ? 'nodes' : 'node'
    return [{
      title: 'Copy ' + nodeText, 
      action: 'copy',
      shortcut: 'y y',
    }, {
      title: 'Cut ' + nodeText,
      action: 'cut',
      shortcut: 'd d',
    }, {
      title: 'Paste after',
      action: 'paste',
      shortcut: 'p',
      disabled: !store.globals.clipboard,
    }]
  },

  store: {
    init: function (store) {
      store._globals.clipboard = null
    },

    actions: {
      copy: function (id) {
        var sel = window.getSelection()
        if (sel.type === 'Range' && !sel.getRangeAt(0).collapsed) {
          return true
        }
        id = id || this.view.active
        if (this.view.mode === 'visual') {
          ids = this.view.selection
          this.setMode('normal')
        } else {
          ids = [id]
        }
        this.globals.clipboard = this.db.exportMany(ids)
      },

      cut: function (id) {
        var sel = window.getSelection()
        if (sel.type === 'Range' && !sel.getRangeAt(0).collapsed) {
          return true
        }
        id = id || this.view.active
        if (id === this.view.root) return
        if (this.view.mode === 'visual') {
          ids = this.view.selection
          next = movement.nextSibling(ids[ids.length - 1], this.view.root, this.db.nodes, true)
          if (!next) {
            next = movement.up(ids[0], this.view.root, this.db.nodes, true)
          }
          if (!next) {
            next = this.db.nodes[ids[0]].parent
          }
          this.setActive(next)
          this.setMode('normal', true)
        } else {
          ids = [id]
          this.goToSurvivingNeighbor(id)
        }
        if (this.view.mode === 'insert') {
          document.activeElement.blur()
        }
        this.globals.clipboard = this.db.exportMany(ids)
        this.executeCommand('remove', {ids: ids})
      },

      paste: function (id) {
        if (!this.globals.clipboard) return
        this.importTrees(id, this.globals.clipboard)
      },

      pasteAbove: function (id) {
        if (!this.globals.clipboard) return
        this.importTrees(id, this.globals.clipboard, true)
      },
    },
  },
}


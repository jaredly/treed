
function reversed(items) {
  var nw = []
  for (var i=items.length; i>0; i--) {
    nw.push(items[i - 1])
  }
  return nw
}

module.exports = {
  // movement
  'select up': {
    help: 'move the cursor up',
    action: function () {
      var prev = this.model.prevSibling(this.active, true)
      if (!prev) return
      this.addToSelection(prev, true)
    },
  },

  'select down': {
    help: 'move the cursor down',
    action: function () {
      var next = this.model.nextSibling(this.active, true)
      if (!next) return
      this.addToSelection(next, false)
    },
  },

  'select to bottom': {
    help: 'move the cursor to the bottom',
    action: function () {
      var n = this.model.ids[this.selection[0]]
        , ch = this.model.ids[n.parent].children
        , ix = ch.indexOf(this.selection[0])
      this.setSelection(ch.slice(ix))
      this.sel_inverted = false
      this.setActive(ch[ch.length-1])
    },
  },

  'select to top': {
    help: 'move the cursor to the top',
    action: function () {
      var n = this.model.ids[this.selection[0]]
        , ch = this.model.ids[n.parent].children
        , ix = ch.indexOf(this.selection[0])
        , items = []
      for (var i=0; i<=ix; i++) {
        items.unshift(ch[i])
      }
      this.setSelection(items)
      this.sel_inverted = items.length > 1
      this.setActive(ch[0])
    },
  },

  'stop selecting': {
    help: 'quit selection mode',
    action: function () {
      this.stopSelecting()
    },
  },

  'edit': {
    help: 'start editing the active node',
    action: function () {
      this.startEditing(this.active)
    },
  },

  'edit start': {
    help: 'edit at the start of the node',
    action: function () {
      this.startEditing(this.active, true)
    },
  },

    // editness
  'cut': {
    help: 'cut the current selection',
    action: function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrlactions.cut(items)
      this.stopSelecting()
    },
  },

  'copy': {
    help: 'copy the current selection',
    action: function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrlactions.copy(items)
      this.stopSelecting()
    },
  },

  'undo': {
    help: 'undo the last change',
    action: function () {
      this.stopSelecting()
      this.ctrlactions.undo()
    },
  },

  'redo': {
    help: 'redo the last undo',
    action: function () {
      this.stopSelecting()
      this.ctrlactions.redo()
    },
  },
}


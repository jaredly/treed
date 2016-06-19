
/**
 * The default actions! Basically all movement, general manipulation,
 * import/export. Actions are given in the context of a view.
 *
 * Plugins can define additional actions.
 *
 * These functions need access to:
 * - nodes
 * - actions
 * - changed()
 * - events.{}
 * - view object
 */
// TODO maybe split this into separate groups? That could be good.

var ContextMenu = require('../lib/context-menu')

module.exports = {
  set: function (id, attr, value, squash) {
    return this.executeCommand('set', {id, attr, value}, squash)
  },

  updateMany: function (ids, updates, squash) {
    return this.executeCommand('updateMany', {ids, updates}, squash)
  },

  update: function (id, update, squash) {
    return this.executeCommand('update', {id, update}, squash)
  },

  importTrees: function (id, trees, above) {
    id = id || this.view.active
    if (above && id === this.root) return
    var node = this.db.nodes[id]
      , pid
      , ix
    if (above) {
      pid = node.parent
      ix = this.db.nodes[pid].children.indexOf(id)
    } else {
      if ((node.children.length && !node.collapsed) || id === this.view.root) {
        pid = id
        ix = 0
      } else {
        pid = node.parent
        ix = this.db.nodes[pid].children.indexOf(id) + 1
      }
    }
    this.executeCommand('importTrees', {
      pid: pid,
      index: ix,
      data: trees,
    }, (err, cState) => {
      if (cState.created.ids.length > 1) {
        this.setMode('visual')
        this.setSelection(cState.created.ids)
      }
      this.setActive(cState.created.ids[0])
    })
  },

  setMany: function (attr, ids, values) {
    this.executeCommand('setMany', {ids: ids, attr: attr, values: values})
  },

  setContent: function (id, value) {
    this.set(id, 'content', value)
  },

  setActiveView: function () {
    if (this.view.id !== this.parent.activeView) {
      console.log('changing active view', this.view.id)
      this.parent.activeView = this.view.id
      this.changed(this.events.activeViewChanged())
    }
  },

  setActive: function (id) {
    if (!id || !this.db.nodes[id]) return
    var old = this.view.active
    this.setActiveView()
    if (id === this.view.active) return
    this.view.active = id
    if (this.view.mode === 'visual') {
      var vix = this.view.selection.indexOf(id)
      if (vix === -1) {
        this.setMode('normal')
      } else if (vix !== 0 && vix !== this.view.selection.length - 1) {
        this.pullBackSelectionTo(id)
      }
    }
    if (this.view.mode === 'insert') this.view.editPos = 'default'
    if (this.db.nodes[old]) {
      this.changed(this.events.nodeViewChanged(old))
    }
    this.changed(
      this.events.activeNodeChanged(),
      this.events.nodeViewChanged(id)
    )
    return true
  },

  pullBackSelectionTo: function (id) {
    this.setSelection(this.view.selection.slice(0, this.view.selection.indexOf(id) + 1))
  },

  setSelection: function (ids) {
    var changed = ids
    if (this.view.selection) {
      changed = this.view.selection.concat(ids)
    }
    this.view.selection = ids
    this.changed.apply(this, changed.map((id) => this.events.nodeViewChanged(id)))
  },

  toggleSelectionEdge: function () {
    if (this.view.mode !== 'visual' || this.view.selection.length <= 1) return
    if (this.view.active === this.view.selection[0]) {
      this.setActive(this.view.selection[this.view.selection.length - 1])
    } else {
      this.setActive(this.view.selection[0])
    }
  },

  extendToFirstSibling: function () {
    if (this.view.active === this.view.root) return
    var pid = this.db.nodes[this.view.active].parent
      , parent = this.db.nodes[pid]
      , i = parent.children.indexOf(this.view.active)
    if (i === 0) return
    if (this.view.selection[0] === this.view.active) {
      this.view.selection = parent.children.slice(0, i).concat(this.view.selection)
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
    } else {
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
      this.view.selection = parent.children.slice(0, i+1)
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
    }
    this.setActive(parent.children[0])
  },

  extendToLastSibling: function () {
    if (this.view.active === this.view.root) return
    var pid = this.db.nodes[this.view.active].parent
      , parent = this.db.nodes[pid]
      , i = parent.children.indexOf(this.view.active)
    if (i === parent.children.length - 1) return
    if (this.view.selection[0] === this.view.active) {
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
      this.view.selection = parent.children.slice(i)
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
    } else {
      this.view.selection = this.view.selection.concat(parent.children.slice(i + 1))
      this.changed(this.view.selection.map(id => this.events.nodeViewChanged(id)))
    }
    this.setActive(parent.children[parent.children.length - 1])
  },

  // TODO move this to a /view actions set if we end up being able to select
  // more than just siblings
  // Selection mode
  extendSelectionUp: function () {
    if (this.view.active === this.view.root) return
    var pid = this.db.nodes[this.view.active].parent
      , parent = this.db.nodes[pid]
      , i = parent.children.indexOf(this.view.active)
    if (i === 0) return
    var prev = parent.children[i-1]
    if (this.view.selection[0] === this.view.active) {
      this.view.selection.unshift(prev)
    } else {
      this.view.selection.pop()
    }
    this.setActive(prev)
  },

  extendSelectionDown: function () {
    if (this.view.active === this.view.root) return
    var pid = this.db.nodes[this.view.active].parent
      , parent = this.db.nodes[pid]
      , i = parent.children.indexOf(this.view.active)
    if (i === parent.children.length - 1) return
    var next = parent.children[i+1]
    if (this.view.selection[this.view.selection.length - 1] === this.view.active) {
      this.view.selection.push(next)
    } else {
      this.view.selection.shift()
    }
    this.setActive(next)
  },

  joinMany: function () {
    if (this.view.mode !== 'visual') return
    var ids = this.view.selection
    var contents = this.db.nodes[ids[0]].content
    for (var i=1; i<ids.length; i++) {
      contents += '\n' + this.db.nodes[ids[i]].content
    }
    this.executeCommands(
      'set', {id: ids[0], attr: 'content', value: contents},
      'remove', {ids: ids.slice(1)}
    )
    this.setActive(ids[0])
  },

  visualMode: function () {
    this.view.selection = [this.view.active]
    this.changed(this.events.nodeViewChanged(this.view.active))
    this.setMode('visual')
  },

  setMode: function (mode, quiet) {
    if (this.view.mode === mode) return
    if (this.view.mode === 'visual') {
      if (!quiet) {
        this.changed(
          this.view.selection.map((id) => this.events.nodeViewChanged(id))
        )
      }
      this.view.selection = null
    }
    this.view.mode = mode
    if (this.view.id === this.parent.activeView) {
      this.changed(this.events.activeModeChanged())
    }
    this.changed(this.events.modeChanged(this.view.id))
  },

  normalMode: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'normal' && this.view.active === id) return
    if (!this.setActive(id)) {
      this.changed(this.events.nodeViewChanged(this.view.active))
    }
    document.activeElement.blur()
    this.setMode('normal')
  },

  // In a codemirrir we just focus, and it will preserve the last focus
  edit: function (id) {
    this.editAt(id, 'default')
  },

  editStart: function (id) {
    this.editAt(id, 'start')
  },

  editEnd: function (id) {
    this.editAt(id, 'end')
  },

  editAt: function (id, at) {
    id = id || this.view.active
    if (this.view.mode === 'edit' && this.view.active === id) return
    if (!this.setActive(id)) {
      this.changed(this.events.nodeViewChanged(this.view.active))
    }
    if (!at) at = 'default'
    this.view.lastEdited = id
    this.view.editPos = at
    this.setMode('insert')
  },

  change: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'edit' && this.view.active === id) return
    if (!this.setActive(id)) {
      this.changed(this.events.nodeViewChanged(this.view.active))
    }
    this.view.editPos = 'change'
    this.setMode('insert')
  },

  showCustomMenu: function (x, y, menu) {
    if (this.globals.clearContextMenu) {
      this.globals.clearContextMenu()
    }
    this.globals.clearContextMenu = ContextMenu.show(menu, x, y)
  },

  showContextMenu: function (x, y, id) {
    var items = []
    if (!id) id = this.view.active
    this.parent.allPlugins.forEach(plugin => {
      if (!plugin.contextMenu) return
      var created = plugin.contextMenu(this.db.nodes[id], this)
      if (!created) return
      if (!Array.isArray(created)) {
        created = [created]
      }
      items = items.concat(created)
    })
    var replaceActions = items => {
      items.forEach(item => {
        if ('string' === typeof item.action) {
          if (!this[item.action]) {
            return console.warn('Unknown context menu action')
          }
          item.action = this[item.action].bind(this, id)
        }
        if (item.children) replaceActions(item.children)
      })
    }
    replaceActions(items)
    this.showCustomMenu(x, y, items)
  },

  hideContextMenu: function () {
    if (this.globals.clearContextMenu) {
      this.globals.clearContextMenu()
      this.globals.clearContextMenu = null
    }
  },

}


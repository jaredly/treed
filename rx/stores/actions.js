
/**
 * These functions need access to:
 * - nodes
 * - actions
 * - changed()
 * - events.{}
 */

var movement = require('../util/movement')

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

  setActive: function (id) {
    if (!id || !this.db.nodes[id]) return
    var old = this.view.active
    if (this.view.id !== this.parent.activeView) {
      console.log('changing active view', this.view.id)
      this.parent.activeView = this.view.id
      this.changed(this.events.activeViewChanged())
    }
    if (id === this.view.active) return
    this.view.active = id
    if (this.view.mode === 'insert') this.view.editPos = 'end'
    if (!this.db.nodes[old]) {
      this.changed(this.events.nodeViewChanged(id))
    } else {
      this.changed(
        this.events.nodeViewChanged(old),
        this.events.nodeViewChanged(id)
      )
    }
    return true
  },

  // TODO: put these in a mixin, b/c they only apply to the treelist this.view?
  // this would be the same mixin that does collapsability? Or maybe there
  // would be a simplified one that doesn't know about collapsibility. Seems
  // like there would be some duplication
  goUp: function () {
    this.setActive(movement.up(this.view.active, this.view.root, this.db.nodes))
  },

  goDown: function (editStart) {
    this.setActive(movement.down(this.view.active, this.view.root, this.db.nodes))
    if (editStart) this.view.editPos = 'start'
  },

  goLeft: function () {
    this.setActive(movement.left(this.view.active, this.view.root, this.db.nodes))
  },

  goRight: function () {
    this.setActive(movement.right(this.view.active, this.view.root, this.db.nodes))
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

  joinDown: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var next = movement.down(id, this.view.root, this.db.nodes)
    if (!next) return
    var content = this.db.nodes[id].content + '\n' + this.db.nodes[next].content
    this.executeCommands(
      'set', {id, attr: 'content', value: content},
      'remove', {ids: [next]}
    )
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

  removeEmpty: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var next = movement.up(id, this.view.root, this.db.nodes)
    this.view.active = next
    this.executeCommand('remove', {ids: [id]})
    this.changed(this.events.nodeChanged(next))
  },

  remove: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var next, ids
    if (this.view.mode === 'visual') {
      ids = this.view.selection
      next = movement.down(ids[ids.length - 1], this.view.root, this.db.nodes, true)
      this.setMode('normal', true)
    } else {
      ids = [id]
      next = movement.down(id, this.view.root, this.db.nodes, true)
    }
    if (!next) {
      next = movement.up(ids[0], this.view.root, this.db.nodes)
    }
    this.view.active = next
    this.executeCommand('remove', {ids: ids})
    this.changed(this.events.nodeChanged(next))
  },

  indent: function (id) {
    id = id || this.view.active
    var pos = movement.indent(id, this.view.root, this.db.nodes)
    if (!pos) return
    var wasEditing = false
    if (this.view.mode === 'insert') {
      document.activeElement.blur()
      wasEditing = true
    }
    this.executeCommand('move', {
      id,
      npid: pos.npid,
      nextIsRoot: pos.npid === this.view.root,
      nindex: pos.nindex,
    })
    if (wasEditing) {
      this.edit()
    }
  },

  indentMany: function () {
    if (this.view.mode !== 'visual') return
    var ids = this.view.selection
    var pos = movement.indent(ids[0], this.view.root, this.db.nodes)
    if (!pos) return
    this.executeCommand('moveMany', {
      ids,
      npid: pos.npid,
      nextIsRoot: pos.npid === this.view.root,
      nindex: pos.nindex,
    })
  },

  dedentMany: function () {
    if (this.view.mode !== 'visual') return
    var ids = this.view.selection
    var pos = movement.dedent(ids[0], this.view.root, this.db.nodes)
    if (!pos) return
    this.executeCommand('moveMany', {
      ids,
      npid: pos.npid,
      nextIsRoot: pos.npid === this.view.root,
      nindex: pos.nindex,
    })
  },

  dedent: function (id) {
    id = id || this.view.active
    var pos = movement.dedent(id, this.view.root, this.db.nodes)
    if (!pos) return
    var wasEditing = false
    if (this.view.mode === 'insert') {
      document.activeElement.blur()
      wasEditing = true
    }
    this.executeCommand('move', {
      id: id,
      npid: pos.npid,
      nextIsRoot: pos.npid === this.view.root,
      nindex: pos.nindex,
    })
    if (wasEditing) {
      this.edit()
    }
  },

  moveDown: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'visual') {
      ids = this.view.selection
    } else {
      ids = [id]
    }
    var pos = movement.below(ids[ids.length - 1], this.view.root, this.db.nodes)
    if (!pos) return
    this.executeCommand('moveMany', {
      ids,
      npid: pos.pid,
      nextIsRoot: pos.pid === this.view.root,
      nindex: pos.ix,
    })
  },

  moveUp: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'visual') {
      ids = this.view.selection
    } else {
      ids = [id]
    }
    var pos = movement.above(ids[0], this.view.root, this.db.nodes)
    if (!pos) return
    this.executeCommand('moveMany', {
      ids,
      npid: pos.pid,
      nextIsRoot: pos.pid === this.view.root,
      nindex: pos.ix,
    })
  },

  createBefore: function (id) {
    id = id || this.view.active
    var node = this.db.nodes[id]
    if (id === this.view.root) return
    this.executeCommand('create', {
      pid: node.parent,
      type: node.type,
      ix: this.db.nodes[node.parent].children.indexOf(id),
    }, (err, cmd) => {
      this.edit(cmd.id)
    })
  },

  createAfter: function (id) {
    id = id || this.view.active
    var node = this.db.nodes[id]
      , pos
    if (id === this.view.root || (node.children.length && !node.collapsed)) {
      pos = {
        pid: id,
        type: node.type,
        ix: 0
      }
    } else {
      pos = {
        pid: node.parent,
        type: node.type,
        ix: this.db.nodes[node.parent].children.indexOf(id) + 1,
      }
    }
    this.executeCommand('create', pos, (err, cmd) => {
      this.edit(cmd.id)
    })
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

  edit: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'edit' && this.view.active === id) return
    if (!this.setActive(id)) {
      this.changed(this.events.nodeViewChanged(this.view.active))
    }
    this.view.lastEdited = id
    this.view.editPos = 'end'
    this.setMode('insert')
  },

  editStart: function (id) {
    id = id || this.view.active
    if (this.view.mode === 'edit' && this.view.active === id) return
    if (!this.setActive(id)) {
      this.changed(this.events.nodeViewChanged(this.view.active))
    }
    this.view.editPos = 'start'
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

  // just for the tree view, pretty much
  goToFirstSibling: function (id) {
    id = id || this.view.active
    var first = movement.firstSibling(id, this.view.root, this.db.nodes)
    if (first === id) {
      first = movement.up(id, this.view.root, this.db.nodes)
    }
    this.setActive(first)
  },

  moveToFirstSibling: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var pid = this.db.nodes[id].parent
      , ch = this.db.nodes[pid].children
      , cix = ch.indexOf(id)
    if (cix === 0) return
    this.executeCommand('move', {
      id,
      nindex: 0,
    })
  },

  moveToLastSibling: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var pid = this.db.nodes[id].parent
      , ch = this.db.nodes[pid].children
      , cix = ch.indexOf(id)
    if (cix === ch.length - 1) return
    this.executeCommand('move', {
      id,
      nindex: ch.length,
    })
  },

  goToLastSibling: function (id) {
    id = id || this.view.active
    var last = movement.lastSibling(id, this.view.root, this.db.nodes)
    if (last === id) {
      last = movement.down(id, this.view.root, this.db.nodes)
    }
    this.setActive(last)
  },

  goToBottom: function () {
    this.setActive(movement.bottom(this.view.root, this.db.nodes))
  },

  goToTop: function () {
    this.setActive(this.view.root)
  },

  goToLastEdited: function () {
    var id = this.view.lastEdited || this.view.root
    this.edit(id)
  },

  goToNextSibling: function (id) {
    id = id || this.view.active
    this.setActive(movement.nextSibling(id, this.view.root, this.db.nodes))
  },

  goToPreviousSibling: function (id) {
    id = id || this.view.active
    this.setActive(movement.prevSibling(id, this.view.root, this.db.nodes))
  },

}

// TODO
function TODO() {
  console.error("TODO not implemented")
}


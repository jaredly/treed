'use strict'

var movement = require('./movement')

module.exports = {
  // TODO: put these in a mixin, b/c they only apply to the treelist this.view?
  // this would be the same mixin that does collapsability? Or maybe there
  // would be a simplified one that doesn't know about collapsibility. Seems
  // like there would be some duplication
  goUp: function () {
    var up = movement.up(this.view.active, this.view.root, this.db.nodes)
    if (!up) return false
    this.setActive(up)
  },

  pageUp: function () {
    var curr = this.view.active
      , up
    for (var i=0; i<10; i++) {
      up = movement.up(curr, this.view.root, this.db.nodes)
      if (!up) break
      curr = up
    }
    this.setActive(curr)
  },

  pageDown: function () {
    var curr = this.view.active
      , down
    for (var i=0; i<10; i++) {
      down = movement.down(curr, this.view.root, this.db.nodes)
      if (!down) break
      curr = down
    }
    this.setActive(curr)
  },

  goDown: function (editStart) {
    var down = movement.down(this.view.active, this.view.root, this.db.nodes)
    if (!down) return false
    this.setActive(down)
    if (editStart) this.view.editPos = 'start'
  },

  goLeft: function () {
    this.setActive(movement.left(this.view.active, this.view.root, this.db.nodes))
  },

  goRight: function () {
    this.setActive(movement.right(this.view.active, this.view.root, this.db.nodes))
  },

  joinUp: function (id, text) {
    id = id || this.view.active
    if (id === this.view.root) return
    var prev = movement.up(id, this.view.root, this.db.nodes)
    if (prev === id) return
    if (!prev) return
    var content = this.db.nodes[prev].content + text
      , at = this.db.nodes[prev].content.length
    this.executeCommands(
      'remove', {ids: [id]},
      'set', {id: prev, attr: 'content', value: content},
      () => setTimeout(_ => this.editAt(prev, at), 0)
    )
  },

  joinDown: function (id) {
    if (!arguments.length && this.view.mode === 'visual') {
      return this.joinMany()
    }
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
    if (!arguments.length && this.view.mode === 'visual') {
      return this.indentMany()
    }
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
    if (!arguments.length && this.view.mode === 'visual') {
      return this.dedentMany()
    }
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
    let ids
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
    let ids
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
      if (err) return console.warn('failed to create')
      this.edit(cmd.id)
    })
  },

  createChild: function (id) {
    id = id || this.view.active
    var node = this.db.nodes[id]
      , pos
    pos = {
      pid: id,
      type: node.type,
      ix: node.children ? node.children.length : 0
    }
    if (node.collapsed) {
      this.executeCommands(
        'set', {id: id, attr: 'collapsed', value: false},
        'create', pos,
        (err, cmd) => {
          if (err) return console.warn('failed to create')
          this.edit(cmd.id)
        })
    } else {
      this.executeCommand('create', pos, (err, cmd) => {
        if (err) return console.warn('failed to create')
        this.edit(cmd.id)
      })
    }
  },

  createAfter: function (id, split, after) {
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
    if (arguments.length === 3) {
      pos.content = after
      this.executeCommands(
        'set', {
          id,
          attr: 'content',
          value: split,
        },
        'create', pos,
        (err, cmd) => {
          if (err) return console.warn('failed to create')
          this.editStart(cmd.id)
        }
      )
    } else {
      this.executeCommand('create', pos, (err, cmd) => {
        if (err) return console.warn('failed to create')
        this.edit(cmd.id)
      })
    }
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
    if (id === this.view.root) return
    var next = movement.nextSibling(id, this.view.root, this.db.nodes)
    if (!next) return false
    this.setActive(next)
  },

  goToPreviousSibling: function (id) {
    id = id || this.view.active
    var prev = movement.prevSibling(id, this.view.root, this.db.nodes)
    if (!prev) {
      prev = movement.up(id, this.view.root, this.db.nodes)
    }
    this.setActive(prev)
  },

  goToSurvivingNeighbor: function (id) {
    id = id || this.view.active
    this.setActive(movement.survivingNeighbor(id, this.view.root, this.db.nodes))
  },

}



/**
 * These functions need access to:
 * - pl.nodes
 * - actions
 * - changed()
 * - events.{}
 */

module.exports = {
  set: function ({id, attr, value}, view, execCmd) {
    execCmd('set', {id, attr, value})
  },

  batchSet: function ({attr, ids, values}, view, execCmd) {
    execCmd('batchSet', {ids: ids, attr: attr, values: values})
  },

  setContent: function ({id, value}, view, execCmd) {
    this.actions.set({id, attr: 'content', value}, view, execCmd, events)
  },

  setActive: function ({id}, view) {
    if (!id || id === view.active) return
    var old = view.active
    view.active = id
    if (view.mode === 'insert') view.editPos = 'end'
    if (!this.pl.nodes[old]) {
      this.changed(this.events.nodeViewChanged(view.id, id))
    } else {
      this.changed(
        this.events.nodeViewChanged(view.id, old),
        this.events.nodeViewChanged(view.id, id)
      )
    }
  },

  // TODO: put these in a mixin, b/c they only apply to the treelist view?
  // this would be the same mixin that does collapsability? Or maybe there
  // would be a simplified one that doesn't know about collapsibility. Seems
  // like there would be some duplication
  goUp: function (_, view) {
    this.actions.setActive(movement.up(view.active, view.root, this.pl.nodes))
  },

  goDown: function ({editStart}, view) {
    this.actions.setActive(movement.down(view.active, view.root, this.pl.nodes))
    if (editStart) view.editPos = 'start'
  },

  goLeft: function (_, view) {
    this.actions.setActive(movement.left(view.active, view.root, this.pl.nodes))
  },

  goRight: function (_, view) {
    this.actions.setActive(movement.right(view.active, view.root, this.pl.nodes))
  },

  remove: function ({id}, view, execCmd) {
    id = id || view.active
    if (id === view.root) return
    var next = movement.down(id, view.root, this.pl.nodes, true)
    if (!next) {
      next = movement.up(id, view.root, this.pl.nodes)
    }
    view.active = next
    execCmd('remove', {id})
    this.changed(this.events.nodeChanged(next))
  },

  indent: function ({id}, view, execCmd) {
    id = id || view.active
    var pos = movement.indent(id, view.root, this.pl.nodes)
    if (!pos) return
    execCmd('move', {
      id,
      npid: pos.npid,
      nindex: pos.nindex,
    })
  },

  dedent: function ({id}, view, execCmd) {
    id = id || view.active
    var pos = movement.dedent(id, view.root, this.pl.nodes)
    if (!pos) return
    execCmd('move', {
      id: id,
      npid: pos.npid,
      nindex: pos.nindex,
    })
  },

  moveDown: function ({id}, view, execCmd) {
    id = id || view.active
    var pos = movement.below(id, view.root, this.pl.nodes)
    if (!pos) return
    execCmd('move', {
      id,
      npid: pos.pid,
      nindex: pos.ix,
    })
  },

  moveUp: function ({id}, view, execCmd) {
    id = id || view.active
    var pos = movement.above(id, view.root, this.pl.nodes)
    if (!pos) return
    execCmd('move', {
      id,
      npid: pos.pid,
      nindex: pos.ix,
    })
  },

  createBefore: function ({id}, view, execCmd) {
    id = id || view.active
    var node = this.pl.nodes[id]
    if (id === view.root) return
    var cmd = execCmd('create', {
      pid: node.parent,
      ix: this.pl.nodes[node.parent].children.indexOf(id),
    })
    this.actions.edit(cmd.id, view, execCmd)
  },

  createAfter: function ({id}, view, execCmd) {
    id = id || view.active
    var node = this.pl.nodes[id]
      , pos
    if (id === view.root || (node.children.length && !node.collapsed)) {
      pos = {
        pid: id,
        ix: 0
      }
    } else {
      pos = {
        pid: node.parent,
        ix: this.pl.nodes[node.parent].children.indexOf(id) + 1,
      }
    }
    var cmd = execCmd('create', pos)
    this.actions.edit(cmd.id, view, execCmd)
  },

  cut: TODO,
  copy: TODO,
  paste: TODO,
  pasteAbove: TODO,

  visualMode: function (_, view) {
    view.mode = 'visual'
    view.selection = [this.active]
    this.changed(
      this.events.nodeViewChanged(view.active), 
      this.events.modeChanged(view.id),
    )
  },

  setMode: function ({mode}, view) {
    if (view.mode === mode) return
    view.mode = mode
    this.changed(this.events.modeChanged(view.id))
  },

  normalMode: function ({id}, view) {
    id = id || view.active
    if (view.mode === 'normal' && view.active === id) return
    if (!this.setActive({id}, view)) {
      this.changed(this.events.nodeViewChanged(view.active))
    }
    this.actions.setMode({'normal'}, view)
  },

  edit: function ({id}, view) {
    id = id || view.active
    if (view.mode === 'edit' && view.active === id) return
    if (!this.setActive({id}, view)) {
      this.changed(this.events.nodeViewChanged(view.active))
    }
    view.editPos = 'end'
    this.actions.setMode({'insert'}, view)
  },

  editStart: function ({id}) {
    id = id || view.active
    if (view.mode === 'edit' && view.active === id) return
    if (!this.setActive({id}, view)) {
      this.changed(this.events.nodeViewChanged(view.active))
    }
    view.editPos = 'start'
    this.actions.setMode({'insert'}, view)
  },

  change: function ({id}, view) {
    id = id || view.active
    if (view.mode === 'edit' && view.active === id) return
    if (!this.setActive({id}, view)) {
      this.changed(this.events.nodeViewChanged(view.active))
    }
    this.editPos = 'change'
    this.actions.setMode({'insert'}, view)
  },

  toggleSelectionEdge: TODO,
}

// TODO
function TODO() {
  console.error("TODO not implemented")
}



/**
 * Commands get:
 * - pl
 * - events
 * Commands need access to:
 * - 
 */

module.exports = {

  set: {
    args: ['id', 'attr', 'value'],
    apply: function (pl, events) {
      this.old = pl.nodes[this.id][this.attr]
      pl.set(this.id, this.attr, this.value)
      return events.nodeChanged(this.id)
    },
    undo: function (pl, events) {
      pl.set(this.id, this.attr, this.old)
      return events.nodeChanged(this.id)
    },
  },

  batchSet: {
    args: ['attr', 'ids', 'values'],
    apply: function (pl, events) {
      this.old = this.ids.map((id) => pl.nodes[id][this.attr])
      pl.batchSet(this.attr, this.ids, this.values)
      return this.ids.map((id) => events.nodeChanged(id))
    },
    undo: function (pl, events) {
      pl.batchSet(this.attr, this.ids, this.old)
      return this.ids.map((id) => events.nodeChanged(id))
    },
  },

  remove: {
    args: ['id'],
    apply: function (pl, events) {
      var node = pl.nodes[this.id]
        , parent = pl.nodes[node.parent]
        , children = parent.children.slice()
        , ix = children.indexOf(this.id)
      if (ix === -1) {
        throw new Error('node is not a child of its parent')
      }
      this.saved = {node: node, ix: ix}
      children.splice(ix, 1)
      pl.set(node.parent, 'children', children)
      pl.remove(this.id)
      return events.nodeChanged(node.parent)
    },
    undo: function (pl, events) {
      var node = this.saved.node
        , parent = pl.nodes[node.parent]
        , children = parent.children.slice()
        , ix = this.saved.ix
      children.splice(ix, 0, this.id)
      pl.save(this.id, this.saved.node)
      pl.set(node.parent, 'children', children)
      return events.nodeChanged(node.parent)
    },
  },

  move: {
    args: ['id', 'npid', 'nindex'],
    apply: function (pl, events) {
      this.opid = pl.nodes[this.id].parent
      this.oindex = pl.removeChild(this.opid, this.id)
      if (this.oindex === -1) {
        throw new Error('node is not a child of its parent')
      }

      pl.insertChild(this.npid, this.id, this.nindex)
      pl.set(this.id, 'parent', this.npid)
      if (pl.nodes[this.npid].collapsed) {
        pl.set(this.npid, 'collapsed', false)
        this.wasCollapsed = true
      }
      if (this.opid === this.npid) {
        return 'node:' + this.npid
      }
      return ['node:' + this.opid, 'node:' + this.npid]
    },

    undo: function (pl, events) {
      pl.removeChild(this.npid, this.id)
      pl.insertChild(this.opid, this.id, this.oindex)
      pl.set(this.id, 'parent', this.opid)
      if (this.wasCollapsed) {
        pl.set(this.npid, 'collapsed', true)
      }
      if (this.opid === this.npid) {
        return 'node:' + this.npid
      }
      return ['node:' + this.opid, 'node:' + this.npid]
    },
  },

  create: {
    args: ['pid', 'ix', 'content'],
    apply: function (pl) {
      this.id = pl.create(this.pid, this.ix, this.content)
      return 'node:' + this.pid
    },
    undo: function (pl) {
      pl.removeChild(this.pid, this.id)
      this.saved = pl.nodes[this.id]
      pl.remove(this.id)
      return 'node:' + this.pid
    },
    redo: function (pl) {
      pl.save(this.id, this.saved)
      pl.insertChild(this.pid, this.id, this.ix)
      return 'node:' + this.pid
    },
  },

}

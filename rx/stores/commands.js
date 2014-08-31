
/**
 * Commands get:
 * - db
 * - events
 * Commands need access to:
 * - 
 */

module.exports = {

  set: {
    args: ['id', 'attr', 'value'],
    apply: function (db, events) {
      this.old = db.nodes[this.id][this.attr]
      db.set(this.id, this.attr, this.value)
      return events.nodeChanged(this.id)
    },
    undo: function (db, events) {
      db.set(this.id, this.attr, this.old)
      return events.nodeChanged(this.id)
    },
  },

  batchSet: {
    args: ['attr', 'ids', 'values'],
    apply: function (db, events) {
      this.old = this.ids.map((id) => db.nodes[id][this.attr])
      db.batchSet(this.attr, this.ids, this.values)
      return this.ids.map((id) => events.nodeChanged(id))
    },
    undo: function (db, events) {
      db.batchSet(this.attr, this.ids, this.old)
      return this.ids.map((id) => events.nodeChanged(id))
    },
  },

  remove: {
    args: ['id'],
    apply: function (db, events) {
      var node = db.nodes[this.id]
        , parent = db.nodes[node.parent]
        , children = parent.children.slice()
        , ix = children.indexOf(this.id)
      if (ix === -1) {
        throw new Error('node is not a child of its parent')
      }
      this.saved = {node: node, ix: ix}
      children.splice(ix, 1)
      db.set(node.parent, 'children', children)
      db.remove(this.id)
      return events.nodeChanged(node.parent)
    },
    undo: function (db, events) {
      var node = this.saved.node
        , parent = db.nodes[node.parent]
        , children = parent.children.slice()
        , ix = this.saved.ix
      children.splice(ix, 0, this.id)
      db.save(this.id, this.saved.node)
      db.set(node.parent, 'children', children)
      return events.nodeChanged(node.parent)
    },
  },

  move: {
    args: ['id', 'npid', 'nindex'],
    apply: function (db, events) {
      this.opid = db.nodes[this.id].parent
      this.oindex = db.removeChild(this.opid, this.id)
      if (this.oindex === -1) {
        throw new Error('node is not a child of its parent')
      }

      db.insertChild(this.npid, this.id, this.nindex)
      db.set(this.id, 'parent', this.npid)
      if (db.nodes[this.npid].collapsed) {
        db.set(this.npid, 'collapsed', false)
        this.wasCollapsed = true
      }
      if (this.opid === this.npid) {
        return 'node:' + this.npid
      }
      return ['node:' + this.opid, 'node:' + this.npid]
    },

    undo: function (db, events) {
      db.removeChild(this.npid, this.id)
      db.insertChild(this.opid, this.id, this.oindex)
      db.set(this.id, 'parent', this.opid)
      if (this.wasCollapsed) {
        db.set(this.npid, 'collapsed', true)
      }
      if (this.opid === this.npid) {
        return 'node:' + this.npid
      }
      return ['node:' + this.opid, 'node:' + this.npid]
    },
  },

  create: {
    args: ['pid', 'ix', 'content'],
    apply: function (db) {
      this.id = db.create(this.pid, this.ix, this.content)
      return 'node:' + this.pid
    },
    undo: function (db) {
      db.removeChild(this.pid, this.id)
      this.saved = db.nodes[this.id]
      db.remove(this.id)
      return 'node:' + this.pid
    },
    redo: function (db) {
      db.save(this.id, this.saved)
      db.insertChild(this.pid, this.id, this.ix)
      return 'node:' + this.pid
    },
  },

}

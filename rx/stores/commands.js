
/**
 * Commands get:
 * - db
 * - events
 * Commands need access to:
 * - 
 */

module.exports = {

  update: {
    args: ['id', 'update'],
    apply: function (db, events) {
      this.old = {}
      for (var name in this.update) {
        this.old[name] = db.nodes[this.id][name]
      }
      db.update(this.id, this.update)
      return events.nodeChanged(this.id)
    },
    undo: function (db, events) {
      db.update(this.id, this.old)
      return events.nodeChanged(this.id)
    },
  },

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

  setMany: {
    args: ['attr', 'ids', 'values'],
    apply: function (db, events) {
      this.old = this.ids.map((id) => db.nodes[id][this.attr])
      db.setMany(this.attr, this.ids, this.values)
      return this.ids.map((id) => events.nodeChanged(id))
    },
    undo: function (db, events) {
      db.setMany(this.attr, this.ids, this.old)
      return this.ids.map((id) => events.nodeChanged(id))
    },
  },

  remove: {
    args: ['ids'],
    apply: function (db, events) {
      var node = db.nodes[this.ids[0]]
        , parent = db.nodes[node.parent]
        , children = parent.children.slice()
        , ix = children.indexOf(this.ids[0])
      if (ix === -1) {
        throw new Error('node is not a child of its parent')
      }
      // TODO: this assumes that ids are contiguous children. I think I can
      // rely on that, but I should be careful.
      this.saved = {
        nodes: this.ids.map((id) => db.nodes[id]),
        ix: ix
      }
      children.splice(ix, this.ids.length)
      db.set(node.parent, 'children', children)
      db.removeMany(this.ids)
      return events.nodeChanged(node.parent)
    },
    undo: function (db, events) {
      var node = this.saved.nodes[0]
        , parent = db.nodes[node.parent]
        , children = parent.children.slice()
        , ix = this.saved.ix
      children.splice.apply(children, [ix, 0].concat(this.ids))
      db.saveMany(this.saved.nodes)
      db.set(node.parent, 'children', children)
      return events.nodeChanged(node.parent)
    },
  },

  importTrees: {
    args: ['pid', 'index', 'data'],
    async: true,
    apply: function (db, events, done) {
      db.dump(this.pid, this.data, this.index, (err, created) => {
        this.created = created 
        done(err, events.nodeChanged(this.pid))
      })
    },

    undo: function (db, events, done) {
      db.set(this.pid, 'children', this.created.oldChildren)
      db.removeMany(this.created.ids)
      done(null, events.nodeChanged(this.pid))
    }
  },

  move: {
    args: ['id', 'npid', 'nindex'],
    apply: function (db, events) {
      this.opid = db.nodes[this.id].parent
      this.oindex = db.removeChild(this.opid, this.id)
      if (this.oindex === -1) {
        throw new Error('node is not a child of its parent')
      }

      if (!this.npid) {
        this.npid = this.opid
        if (this.oindex < this.nindex) {
          this.nindex -= 1
        }
      }

      db.insertChild(this.npid, this.id, this.nindex)
      db.set(this.id, 'parent', this.npid)
      if (db.nodes[this.npid].collapsed) {
        db.set(this.npid, 'collapsed', false)
        this.wasCollapsed = true
      }
      if (this.opid === this.npid) {
        return events.nodeChanged(this.npid)
      }
      return [
        events.nodeChanged(this.opid),
        events.nodeChanged(this.npid)
      ]
    },

    undo: function (db, events) {
      db.removeChild(this.npid, this.id)
      db.insertChild(this.opid, this.id, this.oindex)
      db.set(this.id, 'parent', this.opid)
      if (this.wasCollapsed) {
        db.set(this.npid, 'collapsed', true)
      }
      if (this.opid === this.npid) {
        return events.nodeChanged(this.npid)
      }
      return [
        events.nodeChanged(this.opid),
        events.nodeChanged(this.npid)
      ]
    },
  },

  moveMany: {
    args: ['ids', 'npid', 'nindex'],
    apply: function (db, events) {
      this.opid = db.nodes[this.ids[0]].parent
      this.oindex = db.removeChild(this.opid, this.ids[0], this.ids.length)
      if (this.oindex === -1) {
        throw new Error('node is not a child of its parent')
      }

      if (!this.npid) {
        this.npid = this.opid
      }
      if (this.npid === this.opid) {
        if (this.oindex < this.nindex) {
          this.nindex -= this.ids.length - 1
        }
      }

      db.insertChildren(this.npid, this.ids, this.nindex)
      db.setMany('parent', this.ids, this.npid)
      if (db.nodes[this.npid].collapsed) {
        db.set(this.npid, 'collapsed', false)
        this.wasCollapsed = true
      }
      if (this.opid === this.npid) {
        return events.nodeChanged(this.npid)
      }
      return [
        events.nodeChanged(this.opid),
        events.nodeChanged(this.npid)
      ]
    },

    undo: function (db, events) {
      db.removeChild(this.npid, this.ids[0], this.ids.length)
      db.insertChildren(this.opid, this.ids, this.oindex)
      db.setMany('parent', this.ids, this.opid)
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
    args: ['pid', 'ix', 'type', 'content'],
    apply: function (db) {
      this.id = db.create(this.pid, this.ix, this.content, this.type)
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

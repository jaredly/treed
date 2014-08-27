module.exports = {

  set: {
    args: ['id', 'attr', 'value'],
    apply: function (pl) {
      this.old = pl.nodes[this.id][this.attr]
      pl.set(this.id, this.attr, this.value)
      return 'node:' + this.id
    },
    undo: function (pl) {
      pl.set(this.id, this.attr, this.old)
      return 'node:' + this.id
    },
  },

  batchSet: {
    args: ['attr', 'ids', 'values'],
    apply: function (pl) {
      this.old = this.ids.map((id) => pl.nodes[id][this.attr])
      pl.batchSet(this.attr, this.ids, this.values)
      return this.ids.map((id) => 'node:' + id)
    },
    undo: function (pl) {
      pl.batchSet(this.attr, this.ids, this.old)
      return this.ids.map((id) => 'node:' + id)
    },
  },

  remove: {
    args: ['id'],
    apply: function (pl) {
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
      return 'node:' + node.parent
    },
    undo: function (pl) {
      var node = this.saved.node
        , parent = pl.nodes[node.parent]
        , children = parent.children.slice()
        , ix = this.saved.ix
      children.splice(ix, 0, this.id)
      pl.save(this.id, this.saved.node)
      pl.set(node.parent, 'children', children)
      return 'node:' + node.parent
    },
  },

  move: {
    args: ['id', 'npid', 'nindex'],
    apply: function (pl) {
      this.opid = pl.nodes[this.id].parent
      this.oindex = pl.removeChild(this.opid, this.id)
      if (this.oindex === -1) {
        throw new Error('node is not a child of its parent')
      }

      pl.insertChild(this.npid, this.id, this.nindex)
      pl.set(this.id, 'parent', this.npid)
      return ['node:' + this.opid, 'node:' + this.npid]
    },

    undo: function (pl) {
      pl.removeChild(this.npid, this.id)
      pl.insertChild(this.opid, this.id, this.oindex)
      pl.set(this.id, 'parent', this.opid)
      return ['node:' + this.opid, 'node:' + this.npid]
    },
  },

}

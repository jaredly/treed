
function Manager(root, ids, dom, db) {
  this.ids = ids
  this.root = root
  this.dom = dom
  this.db = db
  this.nextid = 0
}

Manager.prototype = {
  newid: function () {
    while (this.ids[this.nextid]) {
      this.nextid += 1
    }
    var id = this.nextid
    this.nextid += 1
    return id
  },

  // operations
  create: function (pid, index, text) {
    var node = {
      id: this.newid(),
      data: {name: text || ''},
      parent: pid,
      children: []
    }
    this.ids[node.id] = node
    this.ids[pid].children.splice(index, 0, node.id)

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }
    this.dom.add(node, before, this.bounds(node.id))

    return node.id
  },
  remove: function (id) {
    if (id === this.root) return
    var n = this.ids[id]
      , p = this.ids[n.parent]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    delete this.ids[id]

    this.dom.remove(id)
    return {id: id, node: n, ix: ix}
  },
  setData: function (id, data, fromDom) {
    for (var name in data) {
      this.ids[id].data[name] = data[name]
    }
    if (!fromDom) {
      this.dom.setData(id, data)
    }
  },
  readd: function (saved) {
    this.ids[saved.id] = saved.node
    var children = this.ids[saved.node.parent].children
    children.splice(saved.ix, 0, saved.id)
    var before = false
    if (ix < children.length - 1) {
      before = children[index + 1]
    }
    this.dom.add(saved.node, before, this.bounds(saved.id))
  },
  move: function (id, pid, index) {
  },

  // event handling things...
  bounds: function (id) {
    return {
      changed: this.nodeChanged.bind(this, id),
      toggleCollapse: this.toggleCollapse.bind(this, id),
      goUp: this.goUp.bind(this, id),
      goDown: this.goDown.bind(this, id),
      addAfter: this.addAfter.bind(this, id),
      remove: this.remove.bind(this, id),
      setEditing: this.setEditing.bind(this, id),
      doneEditing: this.doneEditing.bind(this, id)
      // TODO: goUp, goDown, indent, dedent, etc.
    }
  }
}


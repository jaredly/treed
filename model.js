
function Model(root, ids, db) {
  this.ids = ids
  this.root = root
  this.db = db
  this.nextid = 0
}

Model.prototype = {
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
    // this.dom.add(node, before, this.bounds(node.id))

    return {
      node: node,
      before: before
    }
  },
  remove: function (id) {
    if (id === this.root) return
    var n = this.ids[id]
      , p = this.ids[n.parent]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    delete this.ids[id]

    return {id: id, node: n, ix: ix}
  },
  setData: function (id, data) {
    for (var name in data) {
      this.ids[id].data[name] = data[name]
    }
  },
  // add back something that was removed
  readd: function (saved) {
    this.ids[saved.id] = saved.node
    var children = this.ids[saved.node.parent].children
    children.splice(saved.ix, 0, saved.id)
    var before = false
    if (saved.ix < children.length - 1) {
      before = children[saved.ix + 1]
    }
    return before
  },
  move: function (id, pid, index) {
    var n = this.ids[id]
      , p = this.ids[n.parent]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    this.ids[pid].children.splice(index, 0, id)
    var before = false
    if (ix < p.children.length - 1) {
      before = p.children[index + 1]
    }
    return before
  },
  appendText: function (id, text) {
    this.ids[id].data.name += text
  },

  // movement calculation
  getParent: function (id) {
    return this.ids[id].parent
  },
  getChild: function (id) {
    if (this.ids[id].children && this.ids[id].children.length) {
      return this.ids[id].children[0]
    }
    return this.nextSibling(id)
  },
  prevSibling: function (id) {
    var pid = this.ids[id].parent
    if (!pid) return
    var ix = this.ids[pid].children.indexOf(id)
    if (ix > 0) return this.ids[pid].children[ix-1]
    return pid
  },
  nextSibling: function (id) {
    var pid = this.ids[id].parent
    if (!pid) return this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix < this.ids[pid].children.length - 1) return this.ids[pid].children[ix + 1]
    return this.ids[id].children[0]
  },
  lastSibling: function (id) {
    var pid = this.ids[id].parent
    if (!pid) return this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === this.ids[pid].children.length - 1) return this.ids[id].children[0]
    return this.ids[pid].children[this.ids[pid].children.length - 1]
  },
  firstSibling: function (id) {
    var pid = this.ids[id].parent
    if (!pid) return // this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === 0) return pid
    return this.ids[pid].children[0]
  },
  idAbove: function (id, collapsed) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    collapsed = collapsed || {}
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix == 0) {
      return pid
    }
    var previd = parent.children[ix - 1]
    while (this.ids[previd].children &&
           this.ids[previd].children.length &&
           !collapsed[previd]) {
      previd = this.ids[previd].children[this.ids[previd].children.length - 1]
    }
    return previd
  },
  idBelow: function (id, collapsed) {
    if (this.ids[id].children &&
        this.ids[id].children.length &&
        !collapsed[id]) {
      return this.ids[id].children[0]
    }
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    while (ix == parent.children.length - 1) {
      parent = this.ids[parent.parent]
      if (!parent) return
      ix = parent.children.indexOf(pid)
      pid = parent.id
    }
    return parent.children[ix + 1]
  },
  idNew: function (id, collapsed) {
    var pid = this.ids[id].parent
      , parent
      , nix
    if (id === this.root ||
        (this.ids[id].children &&
        this.ids[id].children.length &&
        !collapsed[id])) {
      pid = id
      nix = 0
    } else {
      parent = this.ids[pid]
      nix = parent.children.indexOf(id) + 1
    }
    return {
      pid: pid,
      index: nix
    }
  },
  findCollapser: function (id, collapsed) {
    if ((!this.ids[id].children ||
         !this.ids[id].children.length ||
         collapsed[id]) &&
        this.ids[id].parent !== undefined) {
      id = this.ids[id].parent
    }
    return id
  },

  // event handling things...
  bounds: function (id) {
    return {
      // changed: this.nodeChanged.bind(this, id),
      // toggleCollapse: this.toggleCollapse.bind(this, id),
      // goUp: this.goUp.bind(this, id),
      // goDown: this.goDown.bind(this, id),
      // addAfter: this.addAfter.bind(this, id),
      // remove: this.remove.bind(this, id),
      // setEditing: this.setEditing.bind(this, id),
      // doneEditing: this.doneEditing.bind(this, id)
      // TODO: goUp, goDown, indent, dedent, etc.
    }
  },
}


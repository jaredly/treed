
var uuid = require('./uuid')

module.exports = Model

function Model(rootNode, ids, db) {
  this.ids = ids
  this.root = rootNode.id
  this.rootNode = rootNode
  this.db = db
  this.nextid = 100
  this.clipboard = false
  this.boundActions = this.bindActions()
}

/**
 * A single node is
 * - id:
 * - parent: id
 * - children: [id, id, id]
 * - data: {}
 */

Model.prototype = {
  newid: function () {
    return uuid();
    /*
    while (this.ids[this.nextid]) {
      this.nextid += 1
    }
    var id = this.nextid
    this.nextid += 1
    return id + ''
    */
  },

  bindActions: function () {
    var bound = {}
    for (var name in this.actions) {
      bound[name] = this.actions[name].bind(this)
    }
    return bound
  },

  actions: {},

  // export all the data currently stored in the model
  // dumpData() -> all of it
  // dumpData(id) -> children of the given id
  // dumpData(id, true) -> include the ids in the dump
  // {
  //    id: ??,
  //    meta: {},
  //    collapsed: ??,
  //    content: '',
  //    children: [recurse, ...]
  // }
  dumpData: function (id, noids) {
    if (arguments.length === 0) {
      id = this.root
    }
    var res = {
          meta: {},
        }
      , n = this.ids[id]
    res.content = n.content
    res.created = n.created
    res.type = n.type
    res.modified = n.modified
    for (var attr in n.meta) {
      res.meta[attr] = n.meta[attr]
    }
    if (n.children && n.children.length) {
      res.children = []
      for (var i=0; i<n.children.length; i++) {
        res.children.push(this.dumpData(n.children[i], noids))
      }
    }
    if (!noids) res.id = id
    res.collapsed = n.collapsed || false
    return res
  },

  // createNodes(parentId, the index, data as it was dumped)
  // {
  //    content: "",
  //    meta: {}
  //    ... other datas
  //    children: [node, ...]
  // }
  createNodes: function (pid, index, data) {
    var cr = this.create(pid, index, data.content, data.type, data.meta)
    cr.node.collapsed = data.collapsed || false
    if (data.children) {
      for (var i=0; i<data.children.length; i++) {
        this.createNodes(cr.node.id, i, data.children[i])
      }
    }
    return cr
  },

  getBefore: function (pid, index) {
    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }
    return before
  },

  // operations
  create: function (pid, index, text, type, meta) {
    var node = {
      id: this.newid(),
      content: text || '',
      collapsed: false,
      type: type || 'base',
      meta: meta || {},
      parent: pid,
      children: []
    }
    this.ids[node.id] = node
    if (!this.ids[pid].children) {
      this.ids[pid].children = []
    }
    this.ids[pid].children.splice(index, 0, node.id)

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }

    setTimeout(function () {
    this.db.save('node', node.id, node)
    this.db.update('node', pid, {children: this.ids[pid].children})
    }.bind(this))

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

    setTimeout(function () {
      this.db.remove('node', id)
      this.db.update('node', n.parent, {children: p.children})
      // TODO: remove all child nodes
    }.bind(this))

    return {id: id, node: n, ix: ix}
  },

  setContent: function (id, content) {
    this.ids[id].content = content
    this.db.update('node', id, {content: content})
  },

  setAttr: function (id, attr, value) {
    this.ids[id].meta[attr] = value
    this.db.update('node', id, {meta: this.ids[id].meta})
  },

  setMeta: function (id, meta) {
    for (var attr in meta) {
      this.ids[id].meta[attr] = meta[attr]
    }
    this.db.update('node', id, {meta: meta})
  },

  // other stuff
  setCollapsed: function (id, isCollapsed) {
    this.ids[id].collapsed = isCollapsed
    this.db.update('node', id, {collapsed: isCollapsed})
  },

  isCollapsed: function (id) {
    return this.ids[id].collapsed
  },

  hasChildren: function (id) {
    return this.ids[id].children && this.ids[id].children.length
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
    this.db.save('node', saved.node.id, saved.node)
    this.db.update('node', saved.node.parent, {children: children})
    return before
  },

  move: function (id, pid, index) {
    var n = this.ids[id]
      , opid = n.parent
      , p = this.ids[opid]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    if (!this.ids[pid].children) {
      this.ids[pid].children = []
    }
    if (index === false) index = this.ids[pid].children.length
    this.ids[pid].children.splice(index, 0, id)
    this.ids[id].parent = pid

    setTimeout(function () {
    this.db.update('node', opid, {children: p.children})
    this.db.update('node', id, {parent: pid})
    this.db.update('node', pid, {children: this.ids[pid].children})
    }.bind(this))

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }
    return before
  },

  appendText: function (id, text) {
    this.ids[id].content += text
    this.db.update('node', id, {content: this.ids[id].content})
  },

  // movement calculation
  getParent: function (id) {
    return this.ids[id].parent
  },

  commonParent: function (one, two) {
    if (one === two) return one
    var ones = [one]
      , twos = [two]
    while (this.ids[one].parent || this.ids[two].parent) {
      if (this.ids[one].parent) {
        one = this.ids[one].parent
        if (twos.indexOf(one) !== -1) return one
        ones.push(one)
      }
      if (this.ids[two].parent) {
        two = this.ids[two].parent
        if (ones.indexOf(two) !== -1) return two
        twos.push(two)
      }
    }
    return null
  },

  getChild: function (id) {
    if (this.ids[id].children && this.ids[id].children.length) {
      return this.ids[id].children[0]
    }
    return this.nextSibling(id)
  },

  prevSibling: function (id, noparent) {
    var pid = this.ids[id].parent
    if (undefined === pid) return
    var ix = this.ids[pid].children.indexOf(id)
    if (ix > 0) return this.ids[pid].children[ix-1]
    if (!noparent) return pid
  },

  closestNonChild: function (id, others) {
    var closest = this.nextSibling(id, true)
    if (undefined === closest || closest === false) {
      if (others) {
        closest = this.idAbove(others[0])
      } else {
        closest = this.idAbove(id)
      }
    }
    return closest
  },

  nextSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return !strict && this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix < this.ids[pid].children.length - 1) return this.ids[pid].children[ix + 1]
    if (this.ids[id].collapsed) {
      return !strict && this.nextSibling(pid, strict)
    }
    return !strict && this.ids[id].children[0]
  },

  lastSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return !strict && this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === this.ids[pid].children.length - 1) return !strict && this.ids[id].children[0]
    return this.ids[pid].children[this.ids[pid].children.length - 1]
  },

  firstSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return // this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === 0) return !strict && pid
    return this.ids[pid].children[0]
  },

  lastOpen: function (id) {
    var node = this.ids[id]
    while (node.children.length && (node.id === id || !node.collapsed)) {
      node = this.ids[node.children[node.children.length - 1]]
    }
    return node.id
  },

  idAbove: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix === 0) {
      return pid
    }
    var previd = parent.children[ix - 1]
    while (this.ids[previd].children &&
           this.ids[previd].children.length &&
           !this.ids[previd].collapsed) {
      previd = this.ids[previd].children[this.ids[previd].children.length - 1]
    }
    return previd
  },

  // get the place to shift left to
  shiftLeftPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ppid = parent.parent
      , pparent = this.ids[ppid]
    if (!pparent) return
    var pix = pparent.children.indexOf(pid)
    return {
      pid: ppid,
      ix: pix + 1
    }
  },

  shiftUpPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix === 0) {
      var pl = this.shiftLeftPlace(id)
      if (!pl) return
      pl.ix -= 1
      return pl
    }
    return {
      pid: pid,
      ix: ix - 1
    }
  },

  shiftDownPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix >= parent.children.length - 1) {
      return this.shiftLeftPlace(id)
    }
    return {
      pid: pid,
      ix: ix + 1
    }
  },

  moveBeforePlace: function (id, tid) {
    var sib = this.ids[id]
      , pid = sib.parent
      , opid = this.ids[tid].parent
    if (undefined === pid) return
    var parent = this.ids[pid]
    var nix = parent.children.indexOf(id)
    if (pid === opid && parent.children.indexOf(tid) < nix) {
      nix -= 1
    }
    return {
      pid: pid,
      ix: nix
    }
  },

  moveAfterPlace: function (id, oid) {
    var sib = this.ids[id]
      , pid = sib.parent
      , opid = this.ids[oid].parent
    if (undefined === pid) return
    var oix = this.ids[opid].children.indexOf(oid)
    var parent = this.ids[pid]
      , ix = parent.children.indexOf(id) + 1
    if ( pid === opid && ix > oix) ix -= 1
    return {
      pid: pid,
      ix: ix
    }
  },

  idBelow: function (id, root) {
    if (this.ids[id].children &&
        this.ids[id].children.length &&
        (id === root || !this.ids[id].collapsed)) {
      return this.ids[id].children[0]
    }
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    while (ix === parent.children.length - 1) {
      if (parent.id === root) return
      parent = this.ids[parent.parent]
      if (!parent) return
      ix = parent.children.indexOf(pid)
      pid = parent.id
    }
    return parent.children[ix + 1]
  },

  idNew: function (id, before, root) {
    var pid = this.ids[id].parent
      , parent
      , nix
    if (before) {
      parent = this.ids[pid]
      nix = parent.children.indexOf(id)
    } else if (id === this.root ||
        root === id ||
        (this.ids[id].children &&
        this.ids[id].children.length &&
        !this.ids[id].collapsed)) {
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

  samePlace: function (id, place) {
    var pid = this.ids[id].parent
    if (!pid || pid !== place.pid) return false
    var parent = this.ids[pid]
      , ix = parent.children.indexOf(id)
    return ix === place.ix
  },

  findCollapser: function (id) {
    if ((!this.ids[id].children ||
         !this.ids[id].children.length ||
         this.ids[id].collapsed) &&
        this.ids[id].parent !== undefined) {
      id = this.ids[id].parent
    }
    return id
  },
}


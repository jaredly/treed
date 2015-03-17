'use strict'

var movement = module.exports = {

  indent: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
      , ix = nodes[pid].children.indexOf(id)
    if (ix === -1) return
    if (ix === 0) return
    var npid = nodes[pid].children[ix - 1]
    return {
      opid: pid,
      npid: npid,
      nindex: nodes[npid].children.length,
    }
  },

  dedent: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
    if (pid === root) return
    var npid = nodes[pid].parent
      , ix = nodes[npid].children.indexOf(pid)
    if (pid === root) return
    return {
      opid: pid,
      npid: npid,
      nindex: ix + 1,
    }
  },

  nextSibling: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
      , ch = nodes[pid].children
      , ix = ch.indexOf(id)
    if (ix === ch.length - 1) return
    return ch[ix + 1]
  },

  prevSibling: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
      , ch = nodes[pid].children
      , ix = ch.indexOf(id)
    if (ix === 0) return
    return ch[ix - 1]
  },

  firstSibling: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
    return nodes[pid].children[0]
  },

  lastSibling: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
    return nodes[pid].children[nodes[pid].children.length - 1]
  },

  bottom: function (root, nodes) {
    var node = nodes[root]
    if (!node.children.length) return
    node = nodes[node.children[node.children.length - 1]]
    while (node.children.length && !node.collapsed) {
      node = nodes[node.children[node.children.length - 1]]
    }
    return node.id
  },

  up: function (active, root, nodes) {
    if (active === root) return false
    var pid = nodes[active].parent
      , i = nodes[pid].children.indexOf(active)
    if (i === 0) return pid
    var sid = nodes[pid].children[i - 1]
      , sib = nodes[sid]
    while (sib.children.length && !sib.collapsed) {
      sid = sib.children[sib.children.length - 1]
      sib = nodes[sid]
    }
    return sid
  },

  below: function (active, root, nodes) {
    if (active === root) return false
    var pid = nodes[active].parent
      , parent = nodes[pid]
      , ix = parent.children.indexOf(active)

    if (ix === parent.children.length - 1) {
      if (pid === root) return
      return {
        opid: pid,
        pid: parent.parent,
        ix: nodes[parent.parent].children.indexOf(pid) + 1
      }
    }
    var nid = parent.children[ix + 1]
      , next = nodes[nid]
    if (next.children.length && !next.collapsed) {
      return {
        opid: pid,
        pid: nid,
        ix: 0
      }
    }
    return {
      pid: pid,
      ix: ix + 1,
    }
  },

  above: function (active, root, nodes) {
    if (active === root) return false
    var pid = nodes[active].parent
      , parent = nodes[pid]
      , ix = parent.children.indexOf(active)

    if (ix === 0) {
      if (pid === root) return
      return {
        opid: pid,
        pid: parent.parent,
        ix: nodes[parent.parent].children.indexOf(pid)
      }
    }
    var nid = parent.children[ix - 1]
      , next = nodes[nid]
    if (next.children.length && !next.collapsed) {
      return {
        opid: pid,
        pid: nid,
        ix: next.children.length
      }
    }
    return {
      pid: pid,
      ix: ix - 1,
    }
  },

  down: function (active, root, nodes, noChildren) {
    if (nodes[active].children.length && !noChildren &&
        (active === root || !nodes[active].collapsed)) {
      return nodes[active].children[0]
    }
    if (active === root) return false
    var pid = nodes[active].parent
      , parent = nodes[pid]
      , i = parent.children.indexOf(active)
    while (pid !== root && i === parent.children.length - 1) {
      parent = nodes[parent.parent]
      i = parent.children.indexOf(pid)
      pid = parent.id
    }
    if (parent === root) return false
    return parent.children[i + 1]
  },

  left: function (active, root, nodes) {
    if (active === root) return false
    return nodes[active].parent
  },

  right: function (active, root, nodes) {
    var node = nodes[active]
    if (node.children.length && !node.collapsed) {
      return node.children[0]
    }
    return false
  },

  survivingNeighbor: function (id, root, nodes) {
    if (id === root) return false
    var pid = nodes[id].parent
      , ch = nodes[pid].children
      , ix = ch.indexOf(id)
    if (ix < ch.length - 1) return ch[ix + 1]
    if (ix > 0) return ch[ix - 1]
    return pid
  },
}



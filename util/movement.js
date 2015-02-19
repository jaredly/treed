// TODO test

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

  nextSiblingOrCousin: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
      , p = nodes[pid]
      , ch = p.children
      , ix = ch.indexOf(id)
    if (ix < ch.length - 1) return ch[ix + 1]
    // go for siblings

    function visit(id, depth, crawlUp, childId) {
      if (depth === 0) return id
      var ch = nodes[id].children
      if (!ch || nodes[id].collapsed || !ch.length) return false
      var sub
      var i=0
      if (childId) i = ch.indexOf(childId) + 1
      if (depth === 1 && i < ch.length) return ch[i]
      for (; i<ch.length; i++) {
        sub = visit(ch[i], depth-1)
        if (sub) return sub
      }
      if (crawlUp && id !== root) {
        return visit(nodes[id].parent, depth + 1, true, id)
      }
      return false
    }

    return visit(pid, 1, true, id)
  },

  prevSiblingOrCousin: function (id, root, nodes) {
    if (id === root) return
    var pid = nodes[id].parent
      , p = nodes[pid]
      , ch = p.children
      , ix = ch.indexOf(id)
    if (ix > 0) return ch[ix - 1]
    // go for siblings

    function visit(id, depth, crawlUp, childId) {
      if (depth === 0) return id
      var ch = nodes[id].children
      if (!ch || nodes[id].collapsed || !ch.length) return false
      var sub
      var i=ch.length - 1
      if (childId) i = ch.indexOf(childId) - 1
      if (depth === 1 && i >= 0) return ch[i]
      for (; i>=0; i--) {
        sub = visit(ch[i], depth - 1)
        if (sub) return sub
      }
      if (crawlUp && id !== root) {
        return visit(nodes[id].parent, depth + 1, true, id)
      }
      return false
    }

    return visit(pid, 1, true, id)
  },

  nextCousin: function (id, root, nodes) {
    if (id === root) return
    var aunt
      , degree = 1
      , parent = nodes[id].parent
    while (!aunt) {
      var pid = nodes[parent].parent
        , ch = nodes[parent].children
        , ix = ch.indexOf(parent) + 1
      while (ix < ch.length && !(nodes[ch[ix]].children &&
                                     !nodes[ch[ix]].collapsed &&
                                     nodes[ch[ix]].children.length)) {
        ix += 1
      }
      if (ix < ch.length) {
        return nodes[ch[ix]].children[0]
      }
    }
    while (!(aunt = movement.nextSibling(parent, root, nodes))) {
      degree += 1
      parent = nodes[parent].parent
    }
    cousin = aunt
    for (; degree > 0 && nodes[cousin].children && nodes[cousin].children.length; degree--) {
      cousin = nodes[cousin].children[0]
    }
    return cousin
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
}


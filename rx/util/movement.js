// TODO test

module.exports = {
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
      , npid = nodes[pid].parent
      , ix = nodes[npid].children.indexOf(pid)
    if (pid === root) return
    return {
      opid: pid,
      npid: npid,
      nindex: ix + 1,
    }
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


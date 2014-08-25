// TODO test

module.exports = {
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

  down: function (active, root, nodes) {
    if (nodes[active].children.length &&
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


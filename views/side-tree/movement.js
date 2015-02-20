
var movement = module.exports = {
  right: function (id, root, nodes) {
    var up = down = id
    while (up || down) {
      if (down) {
        if (nodes[down].children && nodes[down].children.length) {
          return nodes[down].children[0]
        }
      }
      if (up) {
        up = movement.prevSiblingOrCousin(up, root, nodes)
        if (up && nodes[up].children && nodes[up].children.length) {
          return nodes[up].children[nodes[up].children.length - 1]
        }
      }
      if (down) {
        down = movement.nextSiblingOrCousin(down, root, nodes)
      }
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

}


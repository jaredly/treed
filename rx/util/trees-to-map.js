
var uuid = require('../../lib/uuid')

module.exports = treesToMap

function treesToMap(trees, pid) {
  var nodes = {}
  if (!Array.isArray(trees)) {
    trees = [trees]
  }

  var processChild = (pid, child) => {
    var id = uuid()
    var node = {
      id: id,
      content: child.content,
      children: [],
      parent: pid,
    }
    nodes[id] = node
    for (var name in child) {
      if (['content', 'children'].indexOf(name) !== -1) continue;
      node[name] = child[name]
    }
    if (child.children && child.children.length) {
      node.children = child.children.map(processChild.bind(this, id))
    }
    return id
  }
  var roots = trees.map(processChild.bind(this, pid))
  return {nodes, roots}
}


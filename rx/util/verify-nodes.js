
module.exports = verifyNodes

function verifyNodes(root, map) {
  if (!map[root]) return new Error("Root node not found")
  return verifyNode(map[root], map)
}

function verifyNode(node, map) {
  if (node.children) {
    for (var i=0; i<node.children.length; i++) {
      var child = map[node.children[i]]
      if (!child) return new Error("Child node not found")
      if (child.parent !== node.id) {
        console.log(node)
        console.log(child)
        return new Error("Misparented. " + child.id + " should have parent " + node.id + " but instead it is " + child.parent)
      }
      var err = verifyNode(child, map)
      if (err) return err
    }
  }
}

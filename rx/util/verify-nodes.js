
module.exports = verifyNodes

function verifyNodes(root, map) {
  if (!map[root]) return new Error("Root node not found")
  return verifyNode(map[root], map)
}

function verifyNode(node, map) {
  if (node.children) {
    for (var i=0; i<node.children.length; i++) {
      var child = map[node.children[i]]
      if (!child) {
        child = map[node.children[i]] = {id: node.children[i], content: '*contents missing*', parent: node.id, children: []}
        console.log("Child node not found: " + node.children[i] + ' of ' + node.id)
        // return new Error("Child node not found: " + node.children[i] + ' of ' + node.id)
      }
      if (child.parent !== node.id) {
        console.log('Misparent')
        console.log(node)
        console.log(child)
        child.parent = node.id
        // return new Error("Misparented. " + child.id + " should have parent " + node.id + " but instead it is " + child.parent)
      }
      var err = verifyNode(child, map)
      if (err) return err
    }
  }
}


function Listed(id, ids, node, options) {
  this.o = extend({
    node: DefaultNode
  }, options)
  this.ctrl = new Controller(id, ids)
  node.appendChild(this.ctrl.node)
}


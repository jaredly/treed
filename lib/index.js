
function Listed(id, ids, node, options) {
  this.o = extend({
    node: DefaultNode
  }, options)
  this.model = new Model(id, ids)
  this.ctrl = new Controller(this.model)
  node.appendChild(this.ctrl.node)
}



function Dom(){
  this.dom = {}
}

Dom.prototype = {
  add: function (node, before, bounds) {
    var p = this.dom[node.parent]
      , dom = this.makeNode(node.id, node.data, bounds)
    if (before === false) {
      p.ul.appendChild(dom)
    } else {
      var bef = this.dom[before]
      p.ul.insertBefore(dom, bef.main)
    }
  },
  remove: function (id) {
    var n = this.dom[id]
    n.main.parentNode.removeChild(n.main)
    delete this.dom[id]
  },
  setData: function (id, data) {
    this.dom[id].body.setData(data)
  },

  // stuff
  makeNode: function (id, data, bounds) {
    var dom = document.createElement('li')
      , body = this.bodyFor(id, data, bounds)

    dom.classList.add('listless__item')
    dom.appendChild(body.node);
    var ul = document.createElement('ul')
    dom.appendChild(ul)
    this.dom[id] = {main: dom, body: body, ul: ul}
    return dom
  },

  /** returns a dom node **/
  bodyFor: function (id, data, bounds) {
    var node = this.ids[id]
    var dom = new this.o.node(data, bounds)
    dom.node.classList.add('listless__body')
    return dom
  }
}


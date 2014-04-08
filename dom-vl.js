
function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function DomViewLayer(o) {
  this.dom = {}
  this.o = o
}

DomViewLayer.prototype = {
  remove: function (id) {
    var n = this.dom[id]
    n.main.parentNode.removeChild(n.main)
    delete this.dom[id]
  },
  addNew: function (node, bounds, before) {
    var dom = this.makeNode(node.id, node.data, bounds)
    this.add(node.parent, before, dom)
    if (node.collapsed && node.children.length) {
      this.setCollapsed(node.id, true)
    }
  },
  add: function (parent, before, dom) {
    var p = this.dom[parent]
    if (before === false) {
      p.ul.appendChild(dom)
    } else {
      var bef = this.dom[before]
      p.ul.insertBefore(dom, bef.main)
    }
  },
  body: function (id) {
    return this.dom[id].body
  },
  move: function (id, pid, before) {
    var d = this.dom[id]
    d.main.parentNode.removeChild(d.main)
    if (before === false) {
      this.dom[pid].ul.appendChild(d.main)
    } else {
      this.dom[pid].ul.insertBefore(d.main, this.dom[before].main)
    }
  },
  clearSelection: function (selection) {
    for (var i=0; i<selection.length; i++) {
      if (!this.dom[selection[i]]) continue;
      this.dom[selection[i]].main.classList.remove('selected')
    }
  },
  showSelection: function (selection) {
    if (!selection.length) return
    ensureInView(this.dom[selection[0]].main)
    for (var i=0; i<selection.length; i++) {
      this.dom[selection[i]].main.classList.add('selected')
    }
  },

  setCollapsed: function (id, isCollapsed) {
    this.dom[id].main.classList[isCollapsed ? 'add' : 'remove']('collapsed')
  },

  makeNode: function (id, data, bounds) {
    var dom = document.createElement('li')
      , body = this.bodyFor(id, data, bounds)

    dom.classList.add('listless__item')
    dom.appendChild(body.node);
    var ul = document.createElement('ul')
    ul.classList.add('listless__children')
    dom.appendChild(ul)
    this.dom[id] = {main: dom, body: body, ul: ul}
    return dom
  },

  /** returns a dom node **/
  bodyFor: function (id, data, bounds) {
    var dom = new this.o.node(data, bounds)
    dom.node.classList.add('listless__body')
    return dom
  },

}


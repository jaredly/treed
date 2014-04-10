
function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function DropShadow() {
  this.node = document.createElement('div')
  this.node.classList.add('listless__drop-shadow')
  document.body.appendChild(this.node)
}

DropShadow.prototype = {
  moveTo: function (target) {
    this.node.style.top = target.top + 'px'
    this.node.style.left = target.left + 'px'
    this.node.style.height = target.height + 'px'
    this.node.style.width = target.width + 'px'
  }
}

function DomViewLayer(o) {
  this.dom = {}
  this.o = o
}

DomViewLayer.prototype = {
  dropTargets: function (root, model) {
    var targets = []
      , bc = this.body(root).getBoundingClientRect()
    targets.push({
      id: root,
      top: bc.top,
      left: bc.left,
      width: bc.width,
      height: bc.height
    })
    if (model.isCollapsed(root)) return targets
    var ch = model.ids[root].children
    for (var i=0; i<ch.length; i++) {
      targets = targets.concat(this.dropTargets(ch[i], model))
    }
    return targets
  },
  makeDropShadow: function () {
    return new DropShadow()
  },

  remove: function (id, pid, lastchild) {
    var n = this.dom[id]
    n.main.parentNode.removeChild(n.main)
    delete this.dom[id]
    if (lastchild) {
      this.dom[pid].main.classList.add('listless__item--parent')
    }
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
    p.main.classList.add('listless__item--parent')
  },
  body: function (id) {
    return this.dom[id].body
  },
  move: function (id, pid, before, ppid, lastchild) {
    var d = this.dom[id]
    d.main.parentNode.removeChild(d.main)
    if (lastchild) {
      this.dom[ppid].main.classList.remove('listless__item--parent')
    }
    if (before === false) {
      this.dom[pid].ul.appendChild(d.main)
    } else {
      this.dom[pid].ul.insertBefore(d.main, this.dom[before].main)
    }
    this.dom[pid].main.classList.add('listless__item--parent')
  },
  clearSelection: function (selection) {
    for (var i=0; i<selection.length; i++) {
      if (!this.dom[selection[i]]) continue;
      this.dom[selection[i]].main.classList.remove('selected')
    }
  },
  showSelection: function (selection) {
    if (!selection.length) return
    ensureInView(this.dom[selection[0]].body.node)
    for (var i=0; i<selection.length; i++) {
      this.dom[selection[i]].main.classList.add('selected')
    }
  },

  setCollapsed: function (id, isCollapsed) {
    this.dom[id].main.classList[isCollapsed ? 'add' : 'remove']('collapsed')
  },

  makeNode: function (id, data, bounds) {
    var dom = document.createElement('li')
      , head = document.createElement('div')
      , body = this.bodyFor(id, data, bounds)
      , collapser = document.createElement('div')
      , mover = document.createElement('div')
    collapser.addEventListener('mousedown', function () {bounds.toggleCollapse()})
    collapser.classList.add('listless__collapser')

    mover.addEventListener('mousedown', function () {bounds.startMoving()})
    mover.classList.add('listless__mover')

    dom.classList.add('listless__item')
    dom.appendChild(head)

    head.classList.add('listless__head')
    head.appendChild(collapser)
    head.appendChild(body.node);
    head.appendChild(mover)

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


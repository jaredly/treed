
function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function DropShadow(height) {
  this.node = document.createElement('div')
  this.node.classList.add('listless__drop-shadow')
  this.height = height || 10
  document.body.appendChild(this.node)
}

DropShadow.prototype = {
  moveTo: function (target) {
    this.node.style.top = target.show.y - this.height/2 + 'px'
    this.node.style.left = target.show.left + 'px'
    this.node.style.height = this.height + 'px'
    // this.node.style.height = target.height + 10 + 'px'
    this.node.style.width = target.show.width + 'px'
  },
  remove: function () {
    this.node.parentNode.removeChild(this.node)
  }
}

function DomViewLayer(o) {
  this.dom = {}
  this.root = null
  this.o = o
}

DomViewLayer.prototype = {
  dropTargets: function (root, model, moving, top) {
    var targets = []
      , bc = this.dom[root].head.getBoundingClientRect()
      , target
      , childTarget

    if (!top) {
      target = {
        id: root,
        top: bc.top,
        left: bc.left,
        width: bc.width,
        height: bc.height,
        place: 'after', // 'before',
        show: {
          left: bc.left,// + 20,
          width: bc.width,// - 20,
          y: bc.bottom
        }
      }
      if (model.ids[root].children.length && !model.isCollapsed(root)) {
        // show insert below children
        target.show.y = this.dom[root].ul.getBoundingClientRect().bottom
      }
      targets.push(target)
    }
    if (root === moving) return targets
    childTarget = {
      id: root,
      top: bc.bottom - 7,
      left: bc.left + 20,
      width: bc.width,
      place: 'child',
      show: {
        left: bc.left + 40,
        width: bc.width - 40,
        y: bc.top + bc.height
      },
      height: 7
    }
    targets.push(childTarget)

    if (model.isCollapsed(root)) return targets
    var ch = model.ids[root].children
    for (var i=0; i<ch.length; i++) {
      targets = targets.concat(this.dropTargets(ch[i], model, moving))
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

  setMoving: function (id, isMoving) {
    this.root.classList[isMoving ? 'add' : 'remove']('moving')
    this.dom[id].main.classList[isMoving ? 'add' : 'remove']('moving')
  },

  setDropping: function (id, isDropping, isChild) {
    var cls = 'dropping' + (isChild ? '-child' : '')
    this.dom[id].main.classList[isDropping ? 'add' : 'remove'](cls)
  },

  makeRoot: function (id, data, bounds) {
    var node = this.makeNode(id, data, bounds)
      , root = document.createElement('div')
    root.classList.add('listless')
    root.appendChild(node)
    this.root = root
    return root
  },

  makeNode: function (id, data, bounds) {
    var dom = document.createElement('li')
      , head = document.createElement('div')
      , body = this.bodyFor(id, data, bounds)
      , collapser = document.createElement('div')
      , mover = document.createElement('div')
    collapser.addEventListener('mousedown', function () {bounds.toggleCollapse()})
    collapser.classList.add('listless__collapser')

    mover.addEventListener('mousedown', function (e) {
      e.preventDefault()
      e.stopPropagation()
      bounds.startMoving()
      return false
    })
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
    this.dom[id] = {main: dom, body: body, ul: ul, head: head}
    return dom
  },

  /** returns a dom node **/
  bodyFor: function (id, data, bounds) {
    var dom = new this.o.node(data, bounds)
    dom.node.classList.add('listless__body')
    return dom
  },

}


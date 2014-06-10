
module.exports = DomViewLayer

function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function DropShadow(height, clsName) {
  this.node = document.createElement('div')
  this.node.classList.add(clsName || 'treed__drop-shadow')
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
  clear: function () {
    this.dom = {}
  },

  rebase: function (root) {
    root.parentNode.replaceChild(this.root, root)
  },

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

    if (model.isCollapsed(root) && !top) return targets
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
    if (!n.main.parentNode) return
    try {
      n.main.parentNode.removeChild(n.main)
    } catch (e) {return}
    delete this.dom[id]
    if (lastchild) {
      this.dom[pid].main.classList.add('treed__item--parent')
    }
  },

  addNew: function (node, bounds, before, children) {
    var dom = this.makeNode(node.id, node.content, node.meta, node.depth - this.rootDepth, bounds)
    this.add(node.parent, before, dom, children)
    if (node.collapsed && node.children.length) {
      this.setCollapsed(node.id, true)
    }
  },

  add: function (parent, before, dom, children) {
    var p = this.dom[parent]
    if (before === false) {
      p.ul.appendChild(dom)
    } else {
      var bef = this.dom[before]
      p.ul.insertBefore(dom, bef.main)
    }
    if (children) {
      dom.classList.add('treed__item--parent')
    }
  },

  body: function (id) {
    if (!this.dom[id]) return
    return this.dom[id].body
  },

  move: function (id, pid, before, ppid, lastchild) {
    var d = this.dom[id]
    d.main.parentNode.removeChild(d.main)
    if (lastchild) {
      this.dom[ppid].main.classList.remove('treed__item--parent')
    }
    if (before === false) {
      this.dom[pid].ul.appendChild(d.main)
    } else {
      this.dom[pid].ul.insertBefore(d.main, this.dom[before].main)
    }
    this.dom[pid].main.classList.add('treed__item--parent')
  },

  clearSelection: function (selection) {
    for (var i=0; i<selection.length; i++) {
      if (!this.dom[selection[i]]) continue;
      this.dom[selection[i]].main.classList.remove('selected')
    }
  },

  showSelection: function (selection) {
    if (!selection.length) return
    // ensureInView(this.dom[selection[0]].body.node)
    for (var i=0; i<selection.length; i++) {
      this.dom[selection[i]].main.classList.add('selected')
    }
  },

  clearActive: function (id) {
    if (!this.dom[id]) return
    this.dom[id].main.classList.remove('active')
  },

  showActive: function (id) {
    if (!this.dom[id]) return console.warn('Trying to activate a node that is not rendered')
    ensureInView(this.dom[id].body.node)
    this.dom[id].main.classList.add('active')
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

  makeRoot: function (node, bounds) {
    var dom = this.makeNode(node.id, node.content, node.meta, 0, bounds)
      , root = document.createElement('div')
    root.classList.add('treed')
    root.appendChild(dom)
    if (node.collapsed && node.children.length) {
      this.setCollapsed(node.id, true)
    }
    this.root = root
    this.rootDepth = node.depth
    return root
  },

  makeHead: function (body, actions) {
    var head = document.createElement('div')
      , collapser = document.createElement('div')
      , mover = document.createElement('div')

    collapser.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return
      actions.toggleCollapse()
    })
    collapser.classList.add('treed__collapser')

    mover.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      actions.startMoving()
      return false
    })
    mover.classList.add('treed__mover')

    head.classList.add('treed__head')
    head.appendChild(collapser)
    head.appendChild(body.node);
    head.appendChild(mover)
    return head
  },

  makeNode: function (id, content, meta, level, bounds) {
    var dom = document.createElement('li')
      , body = this.bodyFor(id, content, meta, bounds)

    dom.classList.add('treed__item')
    // dom.classList.add('treed__item--level-' + level)

    var head = this.makeHead(body, bounds)
    dom.appendChild(head)

    var ul = document.createElement('ul')
    ul.classList.add('treed__children')
    dom.appendChild(ul)
    this.dom[id] = {main: dom, body: body, ul: ul, head: head}
    return dom
  },

  /** returns a dom node **/
  bodyFor: function (id, content, meta, bounds) {
    var dom = new this.o.node(content, meta, bounds, id === 'new')
    dom.node.classList.add('treed__body')
    return dom
  },

}


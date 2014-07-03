
var DropShadow = require('./drop-shadow')
  , util = require('./util')

module.exports = DomViewLayer

/**
 * o: options -> { Node: the class }
 */
function DomViewLayer(o) {
  this.dom = {}
  this.root = null
  this.o = util.merge({
    animate: true
  }, o)
}

DomViewLayer.prototype = {
  /**
   * Forget about all nodes - they will be disposed of
   */
  clear: function () {
    this.dom = {}
  },

  /**
   * root: the old root that is to be replaced
   */
  rebase: function (root) {
    if (root.parentNode) {
      root.parentNode.replaceChild(this.root, root)
    }
  },

  /**
   * Recursively generate the drop target definitions for all of the visible
   * nodes under a given root.
   *
   * root: the id of the node to start from
   * model: the model - to find children
   * moving: the id of the node that's moving - so that you won't drop a node
   *         inside itself
   * top: only true the first call, determines if it's the root node (e.g. no
   *      drop target above)
   */
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

  /**
   * Remove a node
   *
   * id: the node to remove
   * pid: the parent id
   * lastchild: whether the node was the last child
   */
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

  /**
   * Add a new node - this is public facing
   *
   * node: object looks like {id:, content:, meta:, parent:}
   * bounds: an object of action functions
   * before: the id before which to add
   * children: whether the new node has children
   */
  addNew: function (node, bounds, before, children) {
    var dom = this.makeNode(node.id, node.content, node.meta, node.depth - this.rootDepth, bounds)
    this.add(node.parent, before, dom, children)
    if (node.collapsed && node.children.length) {
      this.setCollapsed(node.id, true)
    }
  },

  /**
   * Internal function for adding things
   */
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

  /**
   * Get a body
   */
  body: function (id) {
    if (!this.dom[id]) return
    return this.dom[id].body
  },

  /**
   * Move a node from one place to another
   *
   * id:        the id of the node that's moving
   * pid:       the parent id to move it to
   * before:    the node id before which to move it. `false` to append
   * ppid:      the previous parent id
   * lastchild: whether this was the last child of the previous parent
   *            (leaving that parent childless)
   */
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

  /**
   * Remove the selection from a set of nodes
   *
   * selection: [id, ...] nodes to deselect
   */
  clearSelection: function (selection) {
    for (var i=0; i<selection.length; i++) {
      if (!this.dom[selection[i]]) continue;
      this.dom[selection[i]].main.classList.remove('selected')
    }
  },

  /**
   * Show the selection on a set of nodes
   *
   * selection: [id, ...] nodes to select
   */
  showSelection: function (selection) {
    if (!selection.length) return
    // util.ensureInView(this.dom[selection[0]].body.node)
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
    util.ensureInView(this.dom[id].body.node)
    this.dom[id].main.classList.add('active')
  },

  setCollapsed: function (id, isCollapsed) {
    this.dom[id].main.classList[isCollapsed ? 'add' : 'remove']('collapsed')
    /*
    if (this.o.animate) {
      this[isCollapsed ? 'animateCollapse' : 'animateExpand'](id);
    }
    */
  },

  animateCollapse: function (id) {
    var body = this.dom[id].ul
    var done = function (e) {
      body.style.removeProperty('transition')
      body.style.removeProperty('height')
      body.removeEventListener('webkitTransitionEnd', done)
      console.log('xlose!')
    }
    var box = body.getBoundingClientRect()
      , h = box.height
    if (!h) {
      return done()
    }
    body.style.transition = 'height 1s ease-out'
    body.addEventListener('webkitTransitionEnd', done)
    body.style.height = '0'
  },

  animateExpand: function (id, isCollapsed) {
    var body = this.dom[id].ul
    var done = function (e) {
      body.style.removeProperty('transition')
      body.style.removeProperty('height')
      body.removeEventListener('webkitTransitionEnd', done)
      console.log('end!')
    }

    body.style.overflow = 'hidden'
    body.style.visibility = 'hidden'
    body.style.position = 'absolute'
    setTimeout(function () {
        var box = body.getBoundingClientRect()
          , h = box.height
        body.style.height = 0
        body.style.visibility = 'visible'
        body.style.position = 'static'
        body.style.transition = 'height 1s ease-out'
        setTimeout(function () {
            body.addEventListener('webkitTransitionEnd', done)
            body.style.height = h + 'px'
        }, 0);
    }, 0);
  },

  setMoving: function (id, isMoving) {
    this.root.classList[isMoving ? 'add' : 'remove']('moving')
    this.dom[id].main.classList[isMoving ? 'add' : 'remove']('moving')
  },

  setDropping: function (id, isDropping, isChild) {
    var cls = 'dropping' + (isChild ? '-child' : '')
    this.dom[id].main.classList[isDropping ? 'add' : 'remove'](cls)
  },

  /**
   * Create the root node
   */
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

  /**
   * Make the head for a given node
   */
  makeHead: function (body, actions) {
    var head = document.createElement('div')
      , collapser = document.createElement('div')
      , mover = document.createElement('div')

    collapser.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return
      actions.toggleCollapse()
      e.preventDefault()
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

  /**
   * Make a node
   */
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

  /** 
   * Create a body node
   *
   * id: the node if
   * content: the text
   * meta: an object of meta data
   * bounds: bound actions
   */
  bodyFor: function (id, content, meta, bounds) {
    var dom = new this.o.Node(content, meta, bounds, id === 'new')
    dom.node.classList.add('treed__body')
    return dom
  },

}


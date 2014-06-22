
module.exports = View

function reversed(items) {
  var nw = []
  for (var i=items.length; i>0; i--) {
    nw.push(items[i - 1])
  }
  return nw
}

var DomViewLayer = require('./dom-vl')
  , DefaultNode = require('./default-node')
  , DungeonsAndDragons = require('./dnd')
  , keys = require('./keys')
  , util = require('./util')

/**
 * The basic view
 *
 * bindActions: fn()
 * model: the model
 * ctrl: the controller
 * options: options hash
 */
function View(bindActions, model, ctrl, options) {
  options = options || {}
  this.mode = 'normal'
  this.selection = null
  this.sel_inverted = false
  this.active = null
  this.o = util.extend({
    Node: DefaultNode,
    ViewLayer: DomViewLayer,
    noSelectRoot: false
  }, options)
  this.o.keybindings = util.merge(this.default_keys, options.keys)
  this.vl = new this.o.ViewLayer(this.o)
  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl
  // actually DragAndDrop
  this.dnd = new DungeonsAndDragons(this.vl, ctrl.actions.move.bind(ctrl))
  this.lazy_children = {}

  this.newNode = null
  this.attachListeners()
}

View.prototype = {
  getNode: function () {
    return this.vl.root
  },

  rebase: function (newroot, trigger) {
    this.vl.clear()
    var root = this.vl.root
    this.initialize(newroot)
    this.vl.rebase(root)
    this.ctrl.trigger('rebase', newroot)
  },

  initialize: function (root) {
    var node = this.model.ids[root]
      , rootNode = this.vl.makeRoot(node, this.bindActions(root))
    this.active = null
    this.selection = null
    this.lazy_children = {}
    this.root = root
    this.populateChildren(root)
    if (!node.children.length) {
      this.addNew(this.root, 0)
    }
    this.selectSomething()
    return rootNode
  },

  startMoving: function (id) {
    var targets = this.vl.dropTargets(this.root, this.model, id, true)
    this.dnd.startMoving(targets, id)
  },

  addNew: function (pid, index) {
    this.newNode = {
      pid: pid,
      index: index
    }
    var before = this.model.getBefore(pid, index-1)
    this.vl.addNew({
      id: 'new',
      content: '',
      meta: {},
      parent: pid
    }, this.bindActions('new'), before)
  },

  removeNew: function () {
    if (!this.newNode) return false
    var nw = this.newNode
      , lastchild = !this.model.ids[nw.pid].children.length
    this.vl.remove('new', nw.pid, lastchild)
    this.newNode = null
    return nw
  },

  selectSomething: function () {
    var child
    if (!this.model.ids[this.root].children.length) {
      child = 'new'
    } else {
      child = this.model.ids[this.root].children[0]
    }
    this.goTo(child)
  },

  populateChildren: function (id) {
    var node = this.model.ids[id]
    if (node.collapsed && id !== this.root) {
      this.lazy_children[id] = true
      return
    }
    this.lazy_children[id] = false
    if (!node.children || !node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.add(this.model.ids[node.children[i]], false, true)
      this.populateChildren(node.children[i])
    }
  },

  goTo: function (id) {
    if (this.mode === 'insert') {
      this.startEditing(id)
    } else {
      this.setActive(id)
    }
  },

  default_keys: {
    'cut': 'ctrl+x, delete, d d',
    'copy': 'ctrl+c, y y',
    'paste': 'p, ctrl+v',
    'paste above': 'shift+p, ctrl+shift+v',
    'visual mode': 'v, shift+v',

    'change': 'c c, shift+c',
    'edit': 'return, a, shift+a, f2',
    'edit start': 'i, shift+i',
    'first sibling': 'shift+[',
    'last sibling': 'shift+]',
    'move to first sibling': 'shift+alt+[',
    'move to last sibling': 'shift+alt+]',
    'new after': 'o',
    'new before': 'shift+o',
    'jump to top': 'g g',
    'jump to bottom': 'shift+g',
    'up': 'up, k',
    'down': 'down, j',
    'left': 'left, h',
    'right': 'right, l',
    'next sibling': 'alt+j, alt+down',
    'prev sibling': 'alt+k, alt+up',
    'toggle collapse': 'z',
    'collapse': 'alt+h, alt+left',
    'uncollapse': 'alt+l, alt+right',
    'indent': 'tab, shift+alt+l, shift+alt+right',
    'dedent': 'shift+tab, shift+alt+h, shift+alt+left',
    'move down': 'shift+alt+j, shift+alt+down',
    'move up': 'shift+alt+k, shift+alt+i, shift+alt+up',
    'undo': 'ctrl+z, u',
    'redo': 'ctrl+shift+z, shift+r',
  },

  actions: {
    'cut': function () {
      if (this.active === null) return
      this.ctrl.actions.cut(this.active)
    },

    'copy': function () {
      if (this.active === null) return
      this.ctrl.actions.copy(this.active)
    },

    'paste': function () {
      if (this.active === null) return
      this.ctrl.actions.paste(this.active)
    },

    'paste above': function () {
      if (this.active === null) return
      this.ctrl.actions.paste(this.active, true)
    },

    'visual mode': function () {
      if (this.active === this.root) return
      this.setSelection([this.active])
    },

    'undo': function () {
      this.ctrl.undo();
    },

    'redo': function () {
      this.ctrl.redo();
    },

    'change': function () {
      if (this.active === null) {
        this.active === this.root
      }
      this.vl.body(this.active).setContent('')
      this.vl.body(this.active).startEditing()
    },

    'edit': function () {
      if (this.active === null) {
        this.active = this.root
      }
      this.vl.body(this.active).startEditing()
    },

    'edit start': function () {
      if (this.active === null) {
        this.active = this.root
      }
      this.vl.body(this.active).startEditing(true)
    },

    // nav
    'first sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var first = this.model.firstSibling(this.active)
      if (undefined === first) return
      this.setActive(first)
    },

    'last sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var last = this.model.lastSibling(this.active)
      if (undefined === last) return
      this.setActive(last)
    },

    'jump to top': function () {
      this.setActive(this.root)
    },

    'jump to bottom': function () {
      this.setActive(this.model.lastOpen(this.root))
      console.log('bottom')
      // pass
    },

    'up': function () {
      if (this.active === null) {
        this.setActive(this.root)
      } else {
        if (this.active === 'new') return this.setActive(this.root)
        var top = this.active
          , above = this.model.idAbove(top)
        if (above === undefined) above = top
        if (above === this.root && this.o.noSelectRoot) {
          return
        }
        this.setActive(above)
      }
    },

    'down': function () {
      if (this.active === null) {
        this.setActive(this.root)
      } else {
        if (this.active === 'new') return
        if (this.active === this.root &&
            !this.model.ids[this.root].children.length) {
          return this.setActive('new')
        }
        var top = this.active
          , above = this.model.idBelow(top, this.root)
        if (above === undefined) above = top
        this.setActive(above)
      }
    },

    'left': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var left = this.model.getParent(this.active)
      if (undefined === left) return
      this.setActive(left)
    },

    'right': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return
      if (this.active === this.root &&
          !this.model.ids[this.root].children.length) {
        return this.setActive('new')
      }
      var right = this.model.getChild(this.active)
      if (this.model.isCollapsed(this.active)) return
      if (undefined === right) return
      this.setActive(right)
    },

    'next sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return
      var sib = this.model.nextSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },

    'prev sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var sib = this.model.prevSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },

    'move to first sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return
      this.ctrl.actions.moveToTop(this.active)
    },

    'move to last sibling': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return
      this.ctrl.actions.moveToBottom(this.active)
    },

    'new before': function () {
      if (this.active === null) return
      if (this.active === 'new') return this.startEditing()
      this.ctrl.addBefore(this.active)
      this.startEditing()
    },

    'new after': function () {
      if (this.active === null) return
      if (this.active === 'new') return this.startEditing()
      this.ctrl.actions.addAfter(this.active)
      this.startEditing()
    },

    // movez!
    'toggle collapse': function () {
      this.ctrl.actions.toggleCollapse(this.active)
    },

    'collapse': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.toggleCollapse(this.active, true)
    },

    'uncollapse': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.toggleCollapse(this.active, false)
    },

    'indent': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.moveRight(this.active)
    },

    'dedent': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.moveLeft(this.active)
    },

    'move down': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.moveDown(this.active)
    },

    'move up': function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      this.ctrl.actions.moveUp(this.active)
    }

  },

  visual: {
    // movement
    'k, up': function () {
      var prev = this.model.prevSibling(this.active, true)
      if (!prev) return
      this.addToSelection(prev, true)
    },

    'j, down': function () {
      var next = this.model.nextSibling(this.active, true)
      if (!next) return
      this.addToSelection(next, false)
    },

    'shift+g': function () {
      var n = this.model.ids[this.selection[0]]
        , ch = this.model.ids[n.parent].children
        , ix = ch.indexOf(this.selection[0])
      this.setSelection(ch.slice(ix))
      this.sel_inverted = false
      this.setActive(ch[ch.length-1])
    },

    'g g': function () {
      var n = this.model.ids[this.selection[0]]
        , ch = this.model.ids[n.parent].children
        , ix = ch.indexOf(this.selection[0])
        , items = []
      for (var i=0; i<=ix; i++) {
        items.unshift(ch[i])
      }
      this.setSelection(items)
      this.sel_inverted = items.length > 1
      this.setActive(ch[0])
    },

    'v, shift+v, escape': function () {
      this.stopSelecting()
    },

    'i, a, shift+a': function () {
      this.startEditing(this.active)
    },

    'shift+i': function () {
      this.startEditing(this.active, true)
    },

    // editness
    'd, shift+d, ctrl+x': function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrl.actions.cut(items)
      this.stopSelecting()
    },

    'y, shift+y, ctrl+c': function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrl.actions.copy(items)
      this.stopSelecting()
    },

    'u, ctrl+z': function () {
      this.stopSelecting()
      this.ctrl.undo()
    },

    'shift+r, ctrl+shift+z': function () {
      this.stopSelecting()
      this.ctrl.redo()
    },

  },

  extra_actions: {},

  keyHandler: function () {
    var normal = {}
      , action
    for (action in this.o.keybindings) {
      if (!this.actions[action]) {
        throw new Error('Invalid configuration! Unknown action: ' + action)
      }
      normal[this.o.keybindings[action]] = this.actions[action]
    }

    if (this.extra_actions) {
      for (action in this.extra_actions) {
        if (!normal[action]) {
          normal[this.extra_actions[action].binding] = this.extra_actions[action].action
        }
      }
    }

    var handlers = {
      'insert': function () {},
      'normal': keys(normal),
      'visual': keys(this.visual)
    }

    return function () {
      return handlers[this.mode].apply(this, arguments)
    }.bind(this)
  },

  attachListeners: function () {
    var keydown = this.keyHandler()
    window.addEventListener('keydown', function (e) {
      if (e.target.nodeName === 'INPUT') return
      if (this.mode === 'insert') return
      keydown.call(this, e)
    }.bind(this))
  },

  addTree: function (node, before) {
    if (!this.vl.body(node.parent)) {
      return this.rebase(node.parent, true)
    }
    this.add(node, before)
    if (!node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.addTree(this.model.ids[node.children[i]], false)
    }
  },

  // operations
  add: function (node, before, dontfocus) {
    var ed = this.mode === 'insert'
      , children = !!node.children.length
    if (!this.vl.body(node.parent)) {
      return this.rebase(node.parent, true)
    }
    this.vl.addNew(node, this.bindActions(node.id), before, children)
    if (!dontfocus) {
      if (ed) {
        this.vl.body(node.id).startEditing()
      } else {
        this.setActive(node.id)
      }
    }
  },

  remove: function (id, ignoreActive) {
    var pid = this.model.ids[id].parent
      , parent = this.model.ids[pid]
    if (!this.vl.body(id)) {
      return this.rebase(pid, true)
    }
    if (id === this.active && !ignoreActive) {
      this.setActive(this.root)
    }
    this.vl.remove(id, pid, parent && parent.children.length === 1)
    if (parent.children.length === 1 && pid === this.root) {
      setTimeout(function () {
      this.addNew(pid, 0)
      }.bind(this),0)
    }
  },

  setContent: function (id, content) {
    if (!this.vl.body(id)) {
      return this.rebase(id, true)
    }
    this.vl.body(id).setContent(content)
    if (this.mode === 'insert') {
      this.vl.body(id).startEditing()
    }
  },

  setAttr: function (id, attr, value) {
    if (!this.vl.body(id)) {
      return this.rebase(id, true)
    }
    this.vl.body(id).setAttr(attr, value)
    if (this.mode === 'insert') {
      this.vl.body(id).startEditing()
    }
  },

  replaceMeta: function (id, meta) {
    this.vl.body(id).replaceMeta(meta)
    if (this.mode === 'insert') {
      this.vl.body(id).startEditing()
    }
  },

  appendText: function (id, text) {
    this.vl.body(id).addEditText(text)
  },

  move: function (id, pid, before, ppid, lastchild) {
    if (!this.vl.body(id)) {
      return this.rebase(this.model.commonParent(pid, ppid), true)
    }
    var ed = this.mode === 'insert'
    this.vl.move(id, pid, before, ppid, lastchild)
    if (ed) this.startEditing(id)
  },

  startEditing: function (id, fromStart) {
    if (arguments.length === 0) {
      id = this.active !== null ? this.active : this.root
    }
    if (id === this.root && this.o.noSelectRoot) {
      return
    }
    var body = this.vl.body(id)
    if (!body) return
    body.startEditing(fromStart)
  },

  stopEditing: function () {
    if (this.mode !== 'insert') return
    if (this.active === null) return
    this.vl.body(this.active).stopEditing()
  },

  setEditing: function (id) {
    if (this.mode === 'visual') {
      this.stopSelecting()
    }
    this.mode = 'insert'
    this.setActive(id)
  },

  doneEditing: function () {
    this.mode = 'normal'
  },

  setActive: function (id) {
    if (id === this.active) return this.vl.showActive(id)
    if (this.active !== null) {
      this.vl.clearActive(this.active)
    }
    if (!this.vl.dom[id]) {
      id = this.root
    }
    this.active = id
    this.vl.showActive(id)
  },

  getActive: function () {
    if (!this.vl.dom[this.active]) {
      return this.root
    }
    return this.active
  },

  addToSelection: function (id, invert) {
    var ix = this.selection.indexOf(id)
    if (ix === -1) {
      this.selection.push(id)
      this.vl.showSelection([id])
      this.sel_inverted = invert
    } else {
      this.vl.clearSelection(this.selection.slice(ix + 1))
      this.selection = this.selection.slice(0, ix + 1)
      if (this.selection.length === 1) {
        this.sel_inverted = false
      }
    }
    this.setActive(id)
    console.log(this.sel_inverted)
  },

  setSelection: function (sel) {
    this.mode = 'visual'
    this.sel_inverted = false
    if (this.selection) {
      this.vl.clearSelection(this.selection)
    }
    this.selection = sel
    this.vl.showSelection(sel)
  },

  stopSelecting: function () {
    if (this.selection !== null) {
      this.vl.clearSelection(this.selection)
      this.selection = null
    }
    this.mode = 'normal'
  },

  setCollapsed: function (id, what) {
    /*
    if (!this.vl.body(id)) {
      return this.rebase(this.model.ids[id].parent)
    }
    */
    this.vl.setCollapsed(id, what)
    if (what) {
      if (this.mode === 'insert') {
        this.startEditing(id)
      } else {
        this.setActive(id)
      }
    } else {
      if (this.lazy_children[id]) {
        this.populateChildren(id)
      }
    }
    // TODO: event listeners?
  },

  // non-modifying stuff
  goUp: function (id) {
    // should I check to see if it's ok?
    var above = this.model.idAbove(id)
    if (above === false) return
    if (above === this.root && this.o.noSelectRoot) {
      return
    }
    this.vl.body(above).body.startEditing();
  },

  goDown: function (id, fromStart) {
    var below = this.model.idBelow(id, this.root)
    if (below === false) return
    this.vl.body(below).body.startEditing(fromStart)
  },
}


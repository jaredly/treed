
module.exports = View

var DomViewLayer = require('./dom-vl')
  , DefaultNode = require('./default-node')
  , DungeonsAndDragons = require('./dnd')
  , keys = require('./keys')
  , util = require('./util')

function View(bindActions, model, ctrl, options) {
  options = options || {}
  this.selection = []
  this.active = null
  this.editing = false
  this.o = util.extend({
    node: DefaultNode,
    ViewLayer: DomViewLayer,
    noSelectRoot: false
  }, options)
  this.o.keybindings = util.merge(this.default_keys, options.keys)
  this.vl = new this.o.ViewLayer(this.o)
  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl
  this.dnd = new DungeonsAndDragons(this.vl, ctrl.actions.move.bind(ctrl))
  this.childrened = {}

  this.newNode = null
  this.attachListeners()
}

View.prototype = {
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
    this.selection = []
    this.childrened = {}
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
      data: {name: ''},
      parent: pid
    }, this.bindActions('new'), before)
    // this.setSelection('new')
    // this.vl.body('new').startEditing()
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
    if (this.childrened[id]) return
    if (node.collapsed && id !== this.root) return
    this.childrened[id] = true
    if (!node.children || !node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.add(this.model.ids[node.children[i]], false, true)
      this.populateChildren(node.children[i])
    }
  },
  goTo: function (id) {
    if (this.editing) {
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
    'move up': 'shift+alt+k, shift+alt+up',
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
    'undo': function () {
      this.ctrl.undo();
    },
    'redo': function () {
      this.ctrl.redo();
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

  extra_actions: {},

  keyHandler: function () {
    var actions = {}
      , name
    for (name in this.o.keybindings) {
      if (!this.actions[name]) {
        throw new Error('Invalid configuration! Unknown action: ' + name)
      }
      actions[this.o.keybindings[name]] = this.actions[name]
    }

    if (this.extra_actions) {
      for (name in this.extra_actions) {
        if (!actions[name]) {
          actions[this.extra_actions[name].binding] = this.extra_actions[name].action
        }
      }
    }

    return keys(actions)
  },

  attachListeners: function () {
    var keydown = this.keyHandler()
    window.addEventListener('keydown', function (e) {
      if (this.editing) return
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
    var ed = this.editing
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
  remove: function (id) {
    var pid = this.model.ids[id].parent
      , parent = this.model.ids[pid]
    if (!this.vl.body(id)) {
      return this.rebase(pid, true)
    }
    if (id === this.active) {
      this.setActive(this.root)
    }
    this.vl.remove(id, pid, parent && parent.children.length === 1)
    if (parent.children.length === 1 && pid === this.root) {
      setTimeout(function () {
      this.addNew(pid, 0)
      }.bind(this),0)
    }
  },
  setAttr: function (id, attr, value) {
    if (!this.vl.body(id)) {
      return this.rebase(id, true)
    }
    this.vl.body(id).setAttr(attr, value)
    if (this.editing) {
      this.vl.body(id).startEditing()
    }
  },
  setData: function (id, data) {
    this.vl.body(id).setData(data)
    if (this.editing) {
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
    var ed = this.editing
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
  setEditing: function (id) {
    this.editing = true
    this.setActive(id)
  },
  doneEditing: function () {
    this.editing = false
  },
  setActive: function (id) {
    if (id === this.active) return
    if (this.active !== null) {
      this.vl.clearActive(this.active)
    }
    if (!this.vl.dom[id]) {
      id = this.root
    }
    this.active = id
    this.vl.showActive(id)
  },
  setSelection: function (sel) {
    sel = sel.filter(function (id) {
      return !!this.vl.dom[id] && (id !== this.root || !this.o.noSelectRoot)
    }.bind(this))
    if (!sel.length) sel = [this.root]
    this.vl.clearSelection(this.selection)
    this.selection = sel
    this.vl.showSelection(sel)
  },
  setCollapsed: function (id, what) {
    /*
    if (!this.vl.body(id)) {
      return this.rebase(this.model.ids[id].parent)
    }
    */
    this.vl.setCollapsed(id, what)
    if (what) {
      if (this.editing) {
        this.startEditing(id)
      } else {
        this.setActive(id)
      }
    } else {
      this.populateChildren(id)
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



function merge(a, b) {
  var c = {}
  for (var name in a) {
    c[name] = a[name]
  }
  for (var name in b) {
    c[name] = b[name]
  }
  return c
}

function View(bindActions, model, ctrl, options) {
  options = options || {}
  this.selection = []
  this.editing = false
  this.o = extend({
    node: DefaultNode,
    ViewLayer: DomViewLayer,
    noSelectRoot: false
  }, options)
  this.o.keybindings = merge(this.default_keys, options.keys)
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
  rebase: function (newroot) {
    this.vl.clear()
    var root = this.vl.root
    this.initialize(newroot)
    this.vl.rebase(root)
  },
  initialize: function (root) {
    var node = this.model.ids[root]
      , rootNode = this.vl.makeRoot(node, this.bindActions(root))
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
      this.setSelection([id])
    }
  },

  default_keys: {
    'cut': 'ctrl+x, delete, d d',
    'copy': 'ctrl+c, y y',
    'paste': 'p, ctrl+v',
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
      if (!this.selection.length) return
      this.ctrl.actions.cut(this.selection[0])
    },
    'copy': function () {
      if (!this.selection.length) return
      this.ctrl.actions.copy(this.selection[0])
    },
    'paste': function () {
      if (!this.selection.length) return
      this.ctrl.actions.paste(this.selection[0])
    },
    'undo': function () {
      this.ctrl.undo();
    },
    'redo': function () {
      this.ctrl.redo();
    },
    'edit': function () {
      if (!this.selection.length) {
        this.selection = [this.root]
      }
      this.vl.body(this.selection[0]).startEditing()
    },
    'edit start': function () {
      if (!this.selection.length) {
        this.selection = [this.root]
      }
      this.vl.body(this.selection[0]).startEditing(true)
    },
    // nav
    'first sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return this.setSelection([this.root])
      var first = this.model.firstSibling(this.selection[0])
      if (undefined === first) return
      this.setSelection([first])
    },
    'last sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return this.setSelection([this.root])
      var last = this.model.lastSibling(this.selection[0])
      if (undefined === last) return
      this.setSelection([last])
    },
    'jump to top': function () {
      this.setSelection([this.root])
    },
    'jump to bottom': function () {
      this.setSelection([this.model.lastOpen(this.root)])
      console.log('bottom')
      // pass
    },
    'up': function () {
      var selection = this.selection
      if (!selection.length) {
        this.setSelection([this.root])
      } else {
        if (this.selection[0] === 'new') return this.setSelection([this.root])
        var top = selection[0]
          , above = this.model.idAbove(top)
        if (above === undefined) above = top
        if (above === this.root && this.o.noSelectRoot) {
          return
        }
        this.setSelection([above])
      }
    },
    'down': function () {
      var selection = this.selection
      if (!selection.length) {
        this.setSelection([this.root])
      } else {
        if (this.selection[0] === 'new') return
        if (this.selection[0] === this.root &&
            !this.model.ids[this.root].children.length) {
          return this.setSelection(['new'])
        }
        var top = selection[0]
          , above = this.model.idBelow(top, this.root)
        if (above === undefined) above = top
        this.setSelection([above])
      }
    },
    'left': function () {
      var selection = this.selection
      if (!selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return this.setSelection([this.root])
      var left = this.model.getParent(this.selection[0])
      if (undefined === left) return
      this.setSelection([left])
    },
    'right': function () {
      var selection = this.selection
      if (!selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return
      if (this.selection[0] === this.root &&
          !this.model.ids[this.root].children.length) {
        return this.setSelection(['new'])
      }
      var right = this.model.getChild(this.selection[0])
      if (this.model.isCollapsed(this.selection[0])) return
      if (undefined === right) return
      this.setSelection([right])
    },
    'next sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return
      var sib = this.model.nextSibling(this.selection[0])
      if (undefined === sib) return
      this.setSelection([sib])
    },
    'prev sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return this.setSelection([this.root])
      var sib = this.model.prevSibling(this.selection[0])
      if (undefined === sib) return
      this.setSelection([sib])
    },
    'move to first sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return
      this.ctrl.actions.moveToTop(this.selection[0])
    },
    'move to last sibling': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      if (this.selection[0] === 'new') return
      this.ctrl.actions.moveToBottom(this.selection[0])
    },
    'new before': function () {
      if (!this.selection.length) return
      if (this.selection[0] === 'new') return this.startEditing()
      this.ctrl.addBefore(this.selection[0])
      this.startEditing()
    },
    'new after': function () {
      if (!this.selection.length) return
      if (this.selection[0] === 'new') return this.startEditing()
      this.ctrl.actions.addAfter(this.selection[0])
      this.startEditing()
    },
    // movez!
    'toggle collapse': function () {
      this.ctrl.actions.toggleCollapse(this.selection[0])
    },
    'collapse': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.toggleCollapse(this.selection[0], true)
    },
    'uncollapse': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.toggleCollapse(this.selection[0], false)
    },
    'indent': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.moveRight(this.selection[0])
    },
    'dedent': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.moveLeft(this.selection[0])
    },
    'move down': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.moveDown(this.selection[0])
    },
    'move up': function () {
      if (!this.selection.length) {
        return this.setSelection([this.root])
      }
      this.ctrl.actions.moveUp(this.selection[0])
    }
  },

  extra_actions: {},

  keyHandler: function () {
    var actions = {}
    for (var name in this.o.keybindings) {
      if (!this.actions[name]) {
        throw new Error('Invalid configuration! Unknown action: ' + name)
      }
      actions[this.o.keybindings[name]] = this.actions[name]
    }

    if (this.extra_actions) {
      for (var name in this.extra_actions) {
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
    this.vl.addNew(node, this.bindActions(node.id), before, children)
    if (!dontfocus) {
      if (ed) {
        this.vl.body(node.id).startEditing()
      } else {
        this.setSelection([node.id])
      }
    }
  },
  remove: function (id) {
    var pid = this.model.ids[id].parent
      , parent = this.model.ids[pid]
    if (!this.vl.body(id)) return
    this.vl.remove(id, pid, parent && parent.children.length === 1)
    var ix = this.selection.indexOf(id)
    if (ix !== -1) {
      this.selection.splice(ix, 1)
      if (this.selection.length == 0) {
        this.setSelection([this.root])
      } else {
        this.setSelection(this.selection)
      }
    }
    if (parent.children.length === 1 && pid === this.root) {
      setTimeout(function () {
      this.addNew(pid, 0)
      }.bind(this),0)
    }
  },
  setAttr: function (id, attr, value) {
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
    if (!this.vl.body(id)) return
    var ed = this.editing
    this.vl.move(id, pid, before, ppid, lastchild)
    if (ed) this.startEditing(id)
  },
  startEditing: function (id, fromStart) {
    if (arguments.length === 0) {
      id = this.selection.length ? this.selection[0] : this.root
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
    this.setSelection([id])
  },
  doneEditing: function () {
    this.editing = false
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
    if (!this.vl.body(id)) return
    this.vl.setCollapsed(id, what)
    if (what) {
      if (this.editing) {
        this.startEditing(id)
      } else {
        this.setSelection([id])
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
      eteturn
    }
    this.vl.body(above).body.startEditing();
  },
  goDown: function (id, fromStart) {
    var below = this.model.idBelow(id, this.root)
    if (below === false) return
    this.vl.body(below).body.startEditing(fromStart)
  },
}


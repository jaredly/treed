
function View(bindActions, model, ctrl, options) {
  this.selection = {}
  this.editing = false
  this.o = extend({
    node: DefaultNode
  }, options)
  this.vl = new DomViewLayer(this.o)
  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl
  this.attachListeners()
}

View.prototype = {
  initialize: function (root, ids) {
    var node = ids[root]
      , rootNode = this.vl.makeNode(root, node.data, this.bindActions(root))
    this.populateChildren(root, ids)
    this.root = root
    return rootNode
  },
  populateChildren: function (id, ids) {
    var node = ids[id]
    if (!node.children || !node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.add(ids[node.children[i]], false, true)
      this.populateChildren(node.children[i], ids)
    }
  },

  attachListeners: function () {
    var keydown = keys({
      'ctrl x, delete': function () {
        if (!this.selection.length) return
        this.ctrl.actions.cut(this.selection[0])
      },
      'ctrl c': function () {
        if (!this.selection.length) return
        this.ctrl.actions.copy(this.selection[0])
      },
      'p, ctrl v': function () {
        if (!this.selection.length) return
        this.ctrl.actions.paste(this.selection[0])
      },
      'return, a, shift a': function () {
        if (!this.selection.length) {
          this.selection = [this.root]
        }
        this.vl.body(this.selection[0]).startEditing()
      },
      'i, shift i': function () {
        if (!this.selection.length) {
          this.selection = [this.root]
        }
        this.vl.body(this.selection[0]).startEditing(true)
      },
      'shift [': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        var first = this.model.firstSibling(this.selection[0])
        if (undefined === first) return
        this.setSelection([first])
      },
      'shift ]': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        var last = this.model.lastSibling(this.selection[0])
        if (undefined === last) return
        this.setSelection([last])
      },
      'shift alt [': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.moveToTop(this.selection[0])
      },
      'shift alt ]': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.moveToBottom(this.selection[0])
      },
      o: function () {
        if (!this.selection.length) return
        this.ctrl.addAfter(this.selection[0])
        this.startEditing(this.selection[0])
      },
      'up, k': function () {
        var selection = this.selection
        if (!selection.length) {
          this.setSelection([this.root])
        } else {
          var top = selection[0]
            , above = this.model.idAbove(top)
          if (above === undefined) above = top
          this.setSelection([above])
        }
      },
      'down, j': function () {
        var selection = this.selection
        if (!selection.length) {
          this.setSelection([this.root])
        } else {
          var top = selection[0]
            , above = this.model.idBelow(top)
          if (above === undefined) above = top
          this.setSelection([above])
        }
      },
      'left, h': function () {
        var selection = this.selection
        if (!selection.length) {
          return this.setSelection([this.root])
        }
        var left = this.model.getParent(this.selection[0])
        if (undefined === left) return
        this.setSelection([left])
      },
      'right, l': function () {
        var selection = this.selection
        if (!selection.length) {
          return this.setSelection([this.root])
        }
        var right = this.model.getChild(this.selection[0])
        if (this.model.isCollapsed(this.selection[0])) return
        if (undefined === right) return
        this.setSelection([right])
      },
      'alt j, alt down': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        var sib = this.model.nextSibling(this.selection[0])
        if (undefined === sib) return
        this.setSelection([sib])
      },
      'alt k, alt up': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        var sib = this.model.prevSibling(this.selection[0])
        if (undefined === sib) return
        this.setSelection([sib])
      },
      // movez!
      'z': function () {
        this.ctrl.actions.toggleCollapse(this.selection[0])
      },
      'alt h, alt left': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.toggleCollapse(this.selection[0], true)
        // var id = this.model.findCollapser(this.selection[0])
        // if (this.model.isCollapsed(id)) return
        // this.ctrl.executeCommands('collapse', [id, true])
      },
      'alt l, alt right': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.toggleCollapse(this.selection[0], false)
        // if (!this.model.hasChildren(this.selection[0]) || !this.model.isCollapsed(this.selection[0])) return
        // this.ctrl.executeCommands('collapse', [this.selection[0], false])
      },
      'tab, shift alt l, shift alt right': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.moveRight(this.selection[0])
      },
      'shift tab, shift alt h, shift alt left': function () {
        this.shiftLeft()
      },
      'shift alt j, shift alt down': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.moveDown(this.selection[0])
      },
      'shift alt k, shift alt up': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.ctrl.actions.moveUp(this.selection[0])
      },
      'f2': function () {
        this.startEditing()
      },
      // changes
      'ctrl z, u': function () {
        this.ctrl.undo();
      },
      'ctrl shift z': function () {
        this.ctrl.redo();
      }
    })
    window.addEventListener('keydown', function (e) {
      if (this.editing) return // do I really want to skip this?
      keydown.call(this, e)
    }.bind(this))
  },
  shiftLeft: function () {
    if (!this.selection.length) {
      return this.setSelection([this.root])
    }
    this.ctrl.actions.moveLeft(this.selection[0])
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
    this.vl.addNew(node, this.bindActions(node.id), before)
    if (!dontfocus) {
      if (ed) {
        this.vl.body(node.id).startEditing()
      } else {
        this.setSelection([node.id])
      }
    }
  },
  remove: function (id) {
    var pid = this.model.ids[id]
      , parent = this.model.ids[pid]
    this.vl.remove(id, pid, parent && parent.children.length === 1)
    var ix = this.selection.indexOf(id)
    if (ix !== -1) {
      this.selection.splice(ix, 1)
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
    var ed = this.editing
    this.vl.move(id, pid, before, ppid, lastchild)
    if (ed) this.startEditing(id)
  },
  startEditing: function (id, fromStart) {
    if (arguments.length === 0) {
      id = this.selection.length ? this.selection[0] : this.root
    }
    this.vl.body(id).startEditing(fromStart)
  },
  setEditing: function (id) {
    this.editing = true
    this.setSelection([id])
  },
  doneEditing: function () {
    this.editing = false
  },
  setSelection: function (sel) {
    this.vl.clearSelection(this.selection)
    this.selection = sel
    this.vl.showSelection(sel)
  },
  setCollapsed: function (id, what) {
    this.vl.setCollapsed(id, what)
    if (what) {
      if (this.editing) {
        this.startEditing(id)
      } else {
        this.setSelection([id])
      }
    }
    // TODO: event listeners?
  },

  // non-modifying stuff
  goUp: function (id) {
    // should I check to see if it's ok?
    var above = this.model.idAbove(id)
    if (above === false) return
    this.vl.body(id).body.stopEditing();
    this.vl.body(above).body.startEditing();
  },
  goDown: function (id, fromStart) {
    var below = this.model.idBelow(id)
    if (below === false) return
    this.vl.body(id).body.stopEditing()
    this.vl.body(below).body.startEditing(fromStart)
  },
}


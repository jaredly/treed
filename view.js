
function View(bindActions, model, ctrl, options) {
  this.collapsed = {}
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
            , above = this.model.idAbove(top, this.collapsed)
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
            , above = this.model.idBelow(top, this.collapsed)
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
        if (this.collapsed[this.selection[0]]) return
        if (undefined === right) return
        this.setSelection([right])
      },
      'alt h, alt left': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        var id = this.model.findCollapser(this.selection[0], this.collapsed)
        this.toggleCollapse(id, true)
      },
      'alt l, alt right': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        this.toggleCollapse(this.selection[0], false)
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
      'shift alt l, shift alt right': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        // TODO handle multiple selected
        var id = this.selection[0]
        var sib = this.model.prevSibling(id, true)
        if (undefined === sib) return
        this.ctrl.executeCommands('move', [id, sib, false])
      },
      'shift alt h, shift alt left': function () {
        this.shiftLeft()
      },
      'shift alt j, shift alt down': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        // TODO handle multiple selected
        var id = this.selection[0]
        var place = this.model.shiftDownPlace(id)
        if (!place) return
        this.ctrl.executeCommands('move', [id, place.pid, place.ix])
      },
      'shift alt k, shift alt up': function () {
        if (!this.selection.length) {
          return this.setSelection([this.root])
        }
        // TODO handle multiple selected
        var id = this.selection[0]
        var place = this.model.shiftUpPlace(id)
        if (!place) return
        this.ctrl.executeCommands('move', [id, place.pid, place.ix])
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
    // TODO handle multiple selected
    var id = this.selection[0]
    var place = this.model.shiftLeftPlace(id)
    if (!place) return
    this.ctrl.executeCommands('move', [id, place.pid, place.ix])
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
    this.vl.remove(id)
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
  move: function (id, pid, before) {
    this.vl.move(id, pid, before)
  },
  startEditing: function (id, fromStart) {
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

  // non-modifying stuff
  toggleCollapse: function (id, what) {
    this.vl.setCollapsed(id, what)
    this.collapsed[id] = what
    if (what) {
      if (this.editing) {
        this.startEditing(id)
      } else {
        this.setSelection([id])
      }
    }
    // TODO: event listeners?
  },
  goUp: function (id) {
    // should I check to see if it's ok?
    var above = this.model.idAbove(id)
    if (above === false) return
    this.vl.body(id).body.stopEditing();
    this.vl.body(above).body.startEditing();
  },
  goDown: function (id, fromStart) {
    var below = this.model.idBelow(id, this.view.collapsed)
    if (below === false) return
    this.vl.body(id).body.stopEditing()
    this.vl.body(below).body.startEditing(fromStart)
  },
}


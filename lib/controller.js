
function Controller(model, o) {
  o = o || {viewOptions: {}}
  this.o = extend({
    View: View,
  }, o)
  this.o.viewOptions = extend({
    node: DefaultNode
  }, o.viewOptions)
  this.model = model
  this.view = new this.o.View(
    this.bindActions.bind(this),
    this.model, this,
    this.o.viewOptions
  )
  this.node = this.view.initialize(model.root)
  this.cmd = new Commandeger(this.view, this.model)

  for (var name in this.actions) {
    if ('string' === typeof this.actions[name]) continue
    this.actions[name] = this.actions[name].bind(this)
  }
  // connect the two.
}

Controller.prototype = {
  undo: function () {this.cmd.undo()},
  redo: function () {this.cmd.redo()},

  bindActions: function (id) {
    var actions = {}
      , val
    for (var action in this.actions) {
      val = this.actions[action]
      if ('string' === typeof val) {
        val = this[val][action].bind(this[val], id)
      } else {
        val = val.bind(this, id)
      }
      actions[action] = val
    }
    return actions
  },

  executeCommands: function () {
    this.cmd.executeCommands.apply(this.cmd, arguments)
  },

  // public
  setCollapsed: function (id, doCollapse) {
    if (!this.model.hasChildren(id)) return
    if (this.model.isCollapsed(id) === doCollapse) return
    this.executeCommands('collapse', [id, doCollapse]);
  },
  addBefore: function (id, text) {
    var nw = this.model.idNew(id, true)
    this.executeCommands('newNode', [nw.pid, nw.index, text])
  },
  addAfter: function (id, text) {
    var nw = this.model.idNew(id)
    this.executeCommands('newNode', [nw.pid, nw.index, text])
  },

  actions: {
    trigger: function (id, name) {
      this.trigger(name, id)
    },
    goUp: function (id) {
      if (id === this.view.root) return
      // should I check to see if it's ok?
      var above = this.model.idAbove(id)
      if (above === undefined) return
      this.view.startEditing(above);
    },
    goDown: function (id, fromStart) {
      var below = this.model.idBelow(id, this.view.root)
      if (below === undefined) return
      this.view.startEditing(below, fromStart);
    },
    goLeft: function (id) {
      if (id === this.view.root) return
      var parent = this.model.getParent(id)
      if (!parent) return
      this.view.startEditing(parent)
    },
    goRight: function (id) {
      var child = this.model.getChild(id)
      if (!child) return
      this.view.startEditing(child)
    },
    startMoving: function (id) {
      if (id === this.view.root) return
      this.view.startMoving(id)
    },

    // modification
    undo: function () {this.cmd.undo()},
    redo: function () {this.cmd.redo()},

    // commanders
    cut: function (id) {
      if (id === this.view.root) return
      this.executeCommands('cut', [id])
    },
    copy: function (id) {
      this.executeCommands('copy', [id])
    },
    paste: function (id) {
      if (!this.model.clipboard) return
      this.executeCommands('paste', [id])
    },
    changed: function (id, attr, value) {
      if (id === 'new') {
        var nw = this.view.removeNew()
        if (value) this.executeCommands('newNode', [nw.pid, nw.index, value])
        else {
          if (nw.index == 0) {
            this.view.setSelection([nw.pid])
          } else {
            this.view.setSelection([this.model.ids[nw.pid].children[nw.index-1]])
          }
        }
        return
      }
      this.executeCommands('changeNodeAttr', [id, attr, value])
    },
    move: function (where, id, target) {
      var action = {
        before: 'ToBefore',
        after: 'ToAfter',
        child: 'Into'
      }[where]
      this.actions['move' + action](id, target)//target, id)
    },
    moveToBefore: function (id, sid) {
      if (id === this.view.root) return
      var place = this.model.moveBeforePlace(sid, id)
      if (!place) return
      // if (this.model.samePlace(id, place)) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveToAfter: function (id, sid) {
      if (id === this.view.root) return
      var place = this.model.moveAfterPlace(sid, id)
      if (!place) return
      // if (this.model.samePlace(id, place)) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveInto: function (id, pid) {
      if (id === this.view.root) return
      if (this.model.samePlace(id, {pid: pid, ix: 0})) return
      if (!this.model.isCollapsed(pid)) {
        return this.executeCommands('move', [id, pid, 0])
      }
      this.executeCommands('collapse', [pid, false], 'move', [id, pid, 0])
    },
    moveRight: function (id) {
      if (id === this.view.root) return
      var sib = this.model.prevSibling(id, true)
      if (undefined === sib) return
      if (!this.model.isCollapsed(sib)) {
        return this.executeCommands('move', [id, sib, false])
      }
      this.executeCommands('collapse', [sib, false], 'move', [id, sib, false])
    },
    moveLeft: function (id) {
      if (id === this.view.root) return
      if (this.model.ids[id].parent === this.view.root) return
      // TODO handle multiple selected
      var place = this.model.shiftLeftPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveUp: function (id) {
      if (id === this.view.root) return
      // TODO handle multiple selected
      var place = this.model.shiftUpPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveDown: function (id) {
      if (id === this.view.root) return
      // TODO handle multiple selected
      var place = this.model.shiftDownPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveToTop: function (id) {
      if (id === this.view.root) return
      var first = this.model.firstSibling(id)
      if (undefined === first) return
      var pid = this.model.ids[first].parent
      if (pid === undefined) return
      var ix = this.model.ids[pid].children.indexOf(first)
      this.executeCommands('move', [id, pid, ix])
    },
    moveToBottom: function (id) {
      if (id === this.view.root) return
      var last = this.model.lastSibling(id)
      if (undefined === last) return
      var pid = this.model.ids[last].parent
      if (pid === undefined) return
      var ix = this.model.ids[pid].children.indexOf(last)
      this.executeCommands('move', [id, pid, ix + 1])
    },
    toggleCollapse: function (id, yes) {
      if (id === this.view.root) return
      if (arguments.length === 1) {
        yes = !this.model.ids[id].children.length || !this.model.isCollapsed(id)
      }
      if (yes) {
        id = this.model.findCollapser(id)
        if (!this.model.hasChildren(id) || this.model.isCollapsed(id)) return
      } else {
        if (!this.model.hasChildren(id) || !this.model.isCollapsed(id)) return
      }
      this.executeCommands('collapse', [id, yes])
    },
    addBefore: function (id, text) {
      if (id === this.view.root) return
      var nw = this.model.idNew(id, true)
      this.executeCommands('newNode', [nw.pid, nw.index, text])
    },
    addAfter: function (id, text) {
      var nw = this.model.idNew(id, false, this.view.root)
      this.executeCommands('newNode', [nw.pid, nw.index, text])
    },
    remove: function (id, addText) {
      if (id === this.view.root) return
      var before = this.model.idAbove(id)
      this.executeCommands(
        'remove', [id],
        'appendText', [before, addText || '']
      )
    },
    setEditing: 'view',
    doneEditing: 'view'
  }
}


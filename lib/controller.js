
module.exports = Controller

var View = require('./view')
  , Commandeger = require('./commandeger')
  , DefaultNode = require('./default-node')
  , View = require('./view')

  , util = require('./util')

function Controller(model, o) {
  o = o || {viewOptions: {}}
  this.o = util.extend({
    View: View,
  }, o)
  this.o.viewOptions = util.extend({
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

  var actions = {}
  for (var name in this.actions) {
    if ('string' === typeof this.actions[name]) actions[name] = this.actions[name]
    else actions[name] = this.actions[name].bind(this)
  }
  this.actions = actions
  this.listeners = {}
  // connect the two.
}

Controller.prototype = {
  undo: function () {this.cmd.undo()},
  redo: function () {this.cmd.redo()},
  on: function (evt, func) {
    if (!this.listeners[evt]) {
      this.listeners[evt] = []
    }
    this.listeners[evt].push(func)
  },
  trigger: function (evt) {
    if (!this.listeners[evt]) return
    var args = [].slice.call(arguments, 1)
    for (var i=0; i<this.listeners[evt].length; i++) {
      this.listeners[evt][i].apply(null, args)
    }
  },

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

  actions: {
    trigger: function () {
      this.trigger.apply(this, arguments)
    },
    goUp: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return this.view.goTo(this.view.root)
      // should I check to see if it's ok?
      var above = this.model.idAbove(id)
      if (above === undefined) return
      this.view.startEditing(above);
    },
    goDown: function (id, fromStart) {
      if (id === 'new') return this.view.goTo(this.view.root)
      var below = this.model.idBelow(id, this.view.root)
      if (below === undefined) return
      this.view.startEditing(below, fromStart);
    },
    goLeft: function (id) {
      if (id === 'new') return this.view.goTo(this.view.root)
      if (id === this.view.root) return
      var parent = this.model.getParent(id)
      if (!parent) return
      this.view.startEditing(parent)
    },
    goRight: function (id) {
      if (id === 'new') return this.view.goTo(this.view.root)
      var child = this.model.getChild(id)
      if (!child) return
      this.view.startEditing(child)
    },
    startMoving: function (id) {
      if (id === 'new') return
      if (id === this.view.root) return
      this.view.startMoving(id)
    },

    // modification
    undo: function () {this.cmd.undo()},
    redo: function () {this.cmd.redo()},

    // commanders
    cut: function (ids) {
      if (ids === this.view.root) return
      if (!Array.isArray(ids)) {
        ids = [ids]
      }
      this.executeCommands('cut', [ids])
    },
    copy: function (ids) {
      if (!Array.isArray(ids)) {
        ids = [ids]
      }
      this.executeCommands('copy', [ids])
    },

    paste: function (id, above) {
      if (!this.model.clipboard) return
      var nw = this.model.idNew(id, above)
      this.executeCommands('paste', [nw.pid, nw.index])
    },
    changed: function (id, attr, value) {
      if (id === 'new') {
        if (!value) return
        var nw = this.view.removeNew()
        this.executeCommands('newNode', [nw.pid, nw.index, value])
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
      if (id === 'new') return
      var place = this.model.moveBeforePlace(sid, id)
      if (!place) return
      // if (this.model.samePlace(id, place)) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveToAfter: function (id, sid) {
      if (id === this.view.root) return
      if (id === 'new') return
      var place = this.model.moveAfterPlace(sid, id)
      if (!place) return
      // if (this.model.samePlace(id, place)) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveInto: function (id, pid) {
      if (id === this.view.root) return
      if (id === 'new') return
      if (this.model.samePlace(id, {pid: pid, ix: 0})) return
      if (!this.model.isCollapsed(pid)) {
        return this.executeCommands('move', [id, pid, 0])
      }
      this.executeCommands('collapse', [pid, false], 'move', [id, pid, 0])
    },
    moveRight: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      var sib = this.model.prevSibling(id, true)
      if (undefined === sib) return
      if (!this.model.isCollapsed(sib)) {
        return this.executeCommands('move', [id, sib, false])
      }
      this.executeCommands('collapse', [sib, false], 'move', [id, sib, false])
    },
    moveLeft: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      if (this.model.ids[id].parent === this.view.root) return
      // TODO handle multiple selected
      var place = this.model.shiftLeftPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveUp: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      // TODO handle multiple selected
      var place = this.model.shiftUpPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveDown: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      // TODO handle multiple selected
      var place = this.model.shiftDownPlace(id)
      if (!place) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },
    moveToTop: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      var first = this.model.firstSibling(id)
      if (undefined === first) return
      var pid = this.model.ids[first].parent
      if (pid === undefined) return
      var ix = this.model.ids[pid].children.indexOf(first)
      this.executeCommands('move', [id, pid, ix])
    },
    moveToBottom: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      var last = this.model.lastSibling(id)
      if (undefined === last) return
      var pid = this.model.ids[last].parent
      if (pid === undefined) return
      var ix = this.model.ids[pid].children.indexOf(last)
      this.executeCommands('move', [id, pid, ix + 1])
    },
    toggleCollapse: function (id, yes) {
      if (id === this.view.root) return
      if (id === 'new') return
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
      if (id === 'new') {
        // TODO: better behavior here
        return
      }
      var nw = this.model.idNew(id, true)
      this.executeCommands('newNode', [nw.pid, nw.index, text])
    },
    addAfter: function (id, text) {
      var nw
      if (id === 'new') {
        // TODO: better behavior here

        nw = this.view.removeNew()
        this.executeCommands(
          'newNode', [nw.pid, nw.index+1, '']
        )
        return
      }
      if (id === this.view.root) {
        if (this.view.newNode) return this.view.startEditing('new')
        this.view.addNew(id, 0)
        this.view.startEditing('new')
        return
      }
      nw = this.model.idNew(id, false, this.view.root)
      var ed = this.view.editing
      this.executeCommands('newNode', [nw.pid, nw.index, text])
      if (ed) this.view.startEditing()
    },
    remove: function (id, addText) {
      if (id === this.view.root) return
      if (id === 'new') return
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


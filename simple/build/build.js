!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.nm=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

module.exports = BaseNode

var keys = _dereq_('./keys')
  , util = _dereq_('./util')

function BaseNode(content, meta, options, isNew) {
  this.content = content || ''
  this.isNew = isNew
  this.o = options
  this.o.keybindings = util.merge(this.default_keys, options.keys)

  this.editing = false
  this.setupNode();
}

BaseNode.addAction = function (action, binding, func) {
  if (!this.extra_actions) {
    this.extra_actions = {}
  }
  this.extra_actions[action] = {
    binding: binding,
    func: func
  }
}

BaseNode.prototype = {
  // public
  startEditing: function (fromStart) {
  },

  stopEditing: function () {
  },

  addEditText: function (text) {
  },

  setMeta: function (meta) {
  },

  setAttr: function (attr, value) {
  },

  // protexted
  isAtStart: function () {
  },

  isAtEnd: function () {
  },

  isAtBottom: function () {
  },

  isAtTop: function () {
  },

  setupNode: function () {
  },

  setInputValue: function (value) {
  },

  getInputValue: function () {
  },

  setTextContent: function (value) {
  },

  getSelectionPosition: function () {
  },

  // Should there be a canStopEditing?
  focus: function () {
    this.startEditing();
  },

  blur: function () {
    this.stopEditing();
  },

  keyHandler: function () {
    var actions = {}
      , action
    for (action in this.o.keybindings) {
      actions[this.o.keybindings[action]] = this.actions[action]
    }

    if (this.extra_actions) {
      for (action in this.extra_actions) {
        if (!actions[action]) {
          actions[this.extra_actions[action].binding] = this.extra_actions[action].action
        }
      }
    }

    return keys(actions).bind(this)
  },

  default_keys: {
    'undo': 'ctrl+z',
    'redo': 'ctrl+shift+z',
    'collapse': 'alt+left',
    'uncollapse': 'alt+right',
    'dedent': 'shift+tab, shift+alt+left',
    'indent': 'tab, shift+alt+right',
    'move up': 'shift+alt+up',
    'move down': 'shift+alt+down',
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right',
    'add after': 'return',
    'insert return': 'shift+return',
    'merge up': 'backspace',
    'stop editing': 'escape',
  },

  actions: {
    'undo': function () {
      this.o.undo()
    },

    'redo': function () {
      this.o.redo()
    },

    'collapse': function () {
      this.o.toggleCollapse(true)
    },

    'uncollapse': function () {
      this.o.toggleCollapse(false)
    },

    'dedent': function () {
      this.o.moveLeft()
    },

    'indent': function () {
      this.o.moveRight()
    },

    'move up': function () {
      this.o.moveUp()
    },

    'move down': function () {
      this.o.moveDown()
    },

    'up': function () {
      if (this.isAtTop()) {
        this.o.goUp();
      } else {
        return true
      }
    },

    'down': function () {
      if (this.isAtBottom()) {
        this.o.goDown()
      } else {
        return true
      }
    },

    'left': function () {
      if (this.isAtStart()) {
        return this.o.goUp()
      }
      return true
    },

    'right': function () {
      if (this.isAtEnd()) {
        return this.o.goDown(true)
      }
      return true
    },

    'insert return': function (e) {
      return true
    },

    'add after': function () {
      var ss = this.getSelectionPosition()
        , content = this.getVisibleValue()
        , rest = null
      if (this.isMultiLine()) {
        return true
      }
      var rest = this.splitRightOfCursor()
      this.stopEditing()
      this.o.addAfter(rest, true)
    },

    // on backspace
    'merge up': function () {
      var value = this.getInputValue()
      if (!value) {
        return this.o.remove()
      }
      if (!this.isMultiLine() && this.isAtStart()) {
        return this.o.remove(value)
      }
      return true
    },

    'stop editing': function () {
      this.stopEditing();
    }
  },
}


},{"./keys":10,"./util":16}],2:[function(_dereq_,module,exports){

var commands = _dereq_('./commands')

module.exports = Commandeger

function makeCommand(type, args) {
  var names = commands[type].args
    , data = {}
  for (var i=0; i<names.length; i++) {
    data[names[i]] = args[i]
  }
  return {type: type, data: data}
}

/**
 * Manages the execution of commands.
 */
function Commandeger(model) {
  this.commands = []
  this.histpos = 0
  this.view = null
  this.listeners = {}
  this.working = false
  this.model = model
}

Commandeger.prototype = {
  /**
   * Execute one or more comments.
   *
   * Usage:
   *
   * - executeCommands('cmdtype', [args, etc])
   * - executeCommands('cmdtype', [args, etc], 'nother', [more, args])
   *
   * @param {string} type the command to execute
   * @param {list} args a list of args to pass to the comment
   */
  executeCommands: function (type, args) {
    if (this.working) return
    var cmds = [];
    var i
    for (i=0; i<arguments.length; i+=2) {
      cmds.push(makeCommand(arguments[i], arguments[i+1]))
    }
    if (this.histpos > 0) {
      this.commands = this.commands.slice(0, -this.histpos)
      this.histpos = 0
    }
    this.commands.push(cmds)
    for (i=0; i<cmds.length; i++) {
      this.doCommand(cmds[i])
    }
    this.trigger('change')
  },

  /**
   * Trigger an event on listeners
   *
   * @param {string} what the event to trigger
   */
  trigger: function (what) {
    var rest = [].slice.call(arguments, 1)
    for (var item in this.listeners[what]) {
      this.listeners[what][item].apply(null, rest)
    }
  },

  /**
   * Register a listener for an event
   *
   * @param {string} what the event type
   * @param {fn} cb the event handler function
   */
  on: function (what, cb) {
    if (!this.listeners[what]) {
      this.listeners[what] = []
    }
    this.listeners[what].push(cb)
  },

  /**
   * Undo the most recent change, if possible.
   *
   * If history is empty, nothing happens.
   *
   * @return {bool} whether anything actually happened
   */
  undo: function () {
    document.activeElement.blur()
    var pos = this.histpos ? this.histpos + 1 : 1
      , ix = this.commands.length - pos
    if (ix < 0) {
      return false // no more undo!
    }
    var cmds = this.commands[ix]
    for (var i=cmds.length-1; i>=0; i--) {
      this.undoCommand(cmds[i])
    }
    this.histpos += 1
    this.trigger('change')
    return true
  },

  /**
   * Redo the most recent undo, if any
   *
   * @return {bool} whether anothing was redone
   */
  redo: function () {
    var pos = this.histpos ? this.histpos - 1 : -1
      , ix = this.commands.length - 1 - pos
    if (ix >= this.commands.length) {
      return false // no more to redo!
    }
    var cmds = this.commands[ix]
    for (var i=0; i<cmds.length; i++) {
      this.redoCommand(cmds[i])
    }
    this.histpos -= 1
    this.trigger('change')
    return true
  },

  // privatish things
  setView: function (view) {
    this.view = view
  },

  doCommand: function (cmd) {
    this.working = true
    commands[cmd.type].apply.call(cmd.data, this.view, this.model)
    this.working = false
  },

  undoCommand: function (cmd) {
    this.working = true
    commands[cmd.type].undo.call(cmd.data, this.view, this.model)
    this.working = false
  },

  redoCommand: function (cmd) {
    this.working = true
    var c = commands[cmd.type]
    ;(c.redo || c.apply).call(cmd.data, this.view, this.model)
    this.working = false
  },
}


},{"./commands":3}],3:[function(_dereq_,module,exports){

function copy(one) {
  if ('object' !== typeof one) return one
  var two = {}
  for (var attr in one) {
    two[attr] = one[attr]
  }
  return two
}

module.exports = {
  collapse: {
    args: ['id', 'doCollapse'],
    apply: function (view, model) {
      model.setCollapsed(this.id, this.doCollapse)
      view.setCollapsed(this.id, this.doCollapse)
      view.goTo(this.id)
    },
    undo: function (view, model) {
      model.setCollapsed(this.id, !this.doCollapse)
      view.setCollapsed(this.id, !this.doCollapse)
      view.goTo(this.id)
    },
  },
  newNode: {
    args: ['pid', 'index', 'text', 'meta', 'type'],
    apply: function (view, model) {
      var cr = model.create(this.pid, this.index, this.text, this.type, this.meta)
      this.id = cr.node.id
      view.add(cr.node, cr.before)
      // view.startEditing(cr.node.id)
    },
    undo: function (view, model) {
      var ed = view.editing
      view.remove(this.id)
      this.saved = model.remove(this.id)
      var nid = model.ids[this.pid].children[this.index-1]
      if (nid === undefined) nid = this.pid
      if (ed) {
        view.startEditing(nid)
      } else {
        view.setActive(nid)
      }
    },
    redo: function (view, model) {
      var before = model.readd(this.saved)
      view.add(this.saved.node, before)
    }
  },
  appendText: {
    args: ['id', 'text'],
    apply: function (view, model) {
      this.oldtext = model.ids[this.id].content
      model.appendText(this.id, this.text)
      view.appendText(this.id, this.text)
    },
    undo: function (view, model) {
      model.setContent(this.id, this.oldtext)
      view.setContent(this.id, this.oldtext)
    }
  },
  changeContent: {
    args: ['id', 'content'],
    apply: function (view, model) {
      this.oldcontent = model.ids[this.id].content
      model.setContent(this.id, this.content)
      view.setContent(this.id, this.content)
      view.goTo(this.id)
    },
    undo: function (view, model) {
      model.setContent(this.id, this.oldcontent)
      view.setContent(this.id, this.oldcontent)
      view.goTo(this.id)
    }
  },
  changeNodeAttr: {
    args: ['id', 'attr', 'value'],
    apply: function (view, model) {
      this.oldvalue = copy(model.ids[this.id].meta[this.attr])
      model.setAttr(this.id, this.attr, this.value)
      view.setAttr(this.id, this.attr, this.value)
      view.goTo(this.id)
    },
    undo: function (view, model) {
      model.setAttr(this.id, this.attr, this.oldvalue)
      view.setAttr(this.id, this.attr, this.oldvalue)
      view.goTo(this.id)
    }
  },
  changeNode: {
    args: ['id', 'newmeta'],
    apply: function (view, model) {
      this.oldmeta = copy(model.ids[this.id].meta)
      model.setMeta(this.id, this.newmeta)
      view.setMeta(this.id, this.newmeta)
      view.goTo(this.id)
    },
    undo: function (view, model) {
      model.setMeta(this.id, this.oldmeta)
      view.setMeta(this.id, this.oldmeta)
      view.goTo(this.id)
    }
  },
  remove: {
    args: ['id'],
    apply: function (view, model) {
      var closest = model.closestNonChild(this.id)
      view.remove(this.id)
      this.saved = model.remove(this.id)
      view.startEditing(closest)
    },
    undo: function (view, model) {
      var before = model.readd(this.saved)
      view.addTree(this.saved.node, before)
    }
  },
  copy: {
    args: ['ids'],
    apply: function (view, model) {
      var items = this.ids.map(function (id) {
        return model.dumpData(id, true)
      })
      model.clipboard = items
    },
    undo: function (view, model) {
    }
  },
  cut: {
    args: ['ids'],
    // ids are always in descending order, where 0 is the first sibling, and
    // the last item is the last sibling
    apply: function (view, model) {
      var items = this.ids.map(function (id) {
        view.remove(id, true)
        return model.dumpData(id, true)
      })
      model.clipboard = items

      var id = this.ids[this.ids.length-1]
      var closest = model.closestNonChild(id, this.ids)
      this.saved = this.ids.map(function (id) {
        return model.remove(id)
      })

      if (view.editing) {
        view.startEditing(closest)
      } else {
        view.setActive(closest)
      }
    },
    undo: function (view, model) {
      var before
      for (var i=this.saved.length-1; i>=0; i--) {
        before = model.readd(this.saved[i])
        view.addTree(this.saved[i].node, before)
      }
      if (this.ids.length > 1) {
        view.setSelection(this.ids)
        view.setActive(this.ids[this.ids.length-1])
      }
    }
  },
  importData: {
    args: ['pid', 'index', 'data'],
    apply: function (view, model) {
      var pid = this.pid
        , index = this.index
        , ed = view.editing
        , item = this.data
      var cr = model.createNodes(pid, index, item)
      view.addTree(cr.node, cr.before)
      view.setCollapsed(cr.node.parent, false)
      model.setCollapsed(cr.node.parent, false)
      this.newid = cr.node.id
      if (ed) {
        view.startEditing(this.newid)
      } else {
        view.setActive(this.newid)
      }
    },
    undo: function (view, model) {
      var id = this.newid
      var closest = model.closestNonChild(id)
      view.remove(id)
      this.saved = model.remove(id)
      if (view.editing) {
        view.startEditing(closest)
      } else {
        view.setActive(closest)
      }
      // view.remove(this.newid)
      // this.saved = model.remove(this.newid)
      model.clipboard = this.saved
    },
    redo: function (view, model) {
      // var before = model.readd(this.saved)
      // view.addTree(this.saved.node, before)
      var before = model.readd(this.saved)
      view.addTree(this.saved.node, before)
      if (view.editing) {
        view.startEditing(this.newid)
      } else {
        view.setActive(this.newid)
      }
    }
  },
  paste: {
    args: ['pid', 'index'],
    apply: function (view, model) {
      var pid = this.pid
        , index = this.index
        , ed = view.editing
      var ids = model.clipboard.map(function (item) {
        var cr = model.createNodes(pid, index, item)
        view.addTree(cr.node, cr.before)
        view.setCollapsed(cr.node.parent, false)
        model.setCollapsed(cr.node.parent, false)
        index += 1
        return cr.node.id
      })
      this.newids = ids
      if (ids.length == 1) {
        if (ed) {
          view.startEditing(this.newids[0])
        } else {
          view.setActive(this.newids[0])
        }
      } else {
        view.setSelection(ids)
        view.setActive(ids[ids.length-1])
      }
    },
    undo: function (view, model) {
      var id = this.newids[this.newids.length-1]
      var closest = model.closestNonChild(id)
      this.saved = this.newids.map(function (id) {
        view.remove(id)
        return model.remove(id)
      })
      if (view.editing) {
        view.startEditing(closest)
      } else {
        view.setActive(closest)
      }
      // view.remove(this.newid)
      // this.saved = model.remove(this.newid)
      model.clipboard = this.saved
    },
    redo: function (view, model) {
      // var before = model.readd(this.saved)
      // view.addTree(this.saved.node, before)
      this.saved.map(function (item) {
        var before = model.readd(item)
        view.addTree(item.node, before)
      })
    }
  },
  move: {
    args: ['id', 'pid', 'index'],
    apply: function (view, model) {
      this.opid = model.ids[this.id].parent
      this.oindex = model.ids[this.opid].children.indexOf(this.id)
      var before = model.move(this.id, this.pid, this.index)
      var parent = model.ids[this.opid]
        , lastchild = parent.children.length === 0
      view.move(this.id, this.pid, before, this.opid, lastchild)
      view.goTo(this.id)
    },
    undo: function (view, model) {
      var before = model.move(this.id, this.opid, this.oindex)
        , lastchild = model.ids[this.pid].children.length === 0
      view.move(this.id, this.opid, before, this.pid, lastchild)
      view.goTo(this.id)
    }
  }
}


},{}],4:[function(_dereq_,module,exports){

module.exports = Controller

var Commandeger = _dereq_('./commandeger')

  , util = _dereq_('./util')

function Controller(model, o) {
  o = o || {viewOptions: {}}
  this.o = util.extend({}, o)
  this.model = model
  this.cmd = new Commandeger(this.model)

  var actions = {}
  for (var action in this.actions) {
    if ('string' === typeof this.actions[action]) actions[action] = this.actions[action]
    else actions[action] = this.actions[action].bind(this)
  }
  this.actions = actions
  this.listeners = {}
}

Controller.prototype = {
  /**
   * Set the current view
   *
   * @param {class} View the View class
   * @param {object} options the options to pass to the view
   * @return {View} the view object
   */
  setView: function (View, options) {
    var oview = this.view
    this.view = new View(
      this.bindActions.bind(this),
      this.model, this,
      options
    )

    var root = (oview ? oview.root : this.model.root);
    var node = this.view.initialize(root)
    if (oview) {
      oview.getNode().parentNode.replaceChild(node, oview.getNode());
    }
    this.cmd.setView(this.view)
    return this.view
  },

  /**
   * Undo the most recent comment
   */
  undo: function () {
    this.cmd.undo()
  },

  /**
   * Redo the most recent undo
   */
  redo: function () {
    this.cmd.redo()
  },

  /**
   * Attach a listener
   */
  on: function (evt, func) {
    if (!this.listeners[evt]) {
      this.listeners[evt] = []
    }
    this.listeners[evt].push(func)
  },

  /**
   * Remove a listener
   */
  off: function (evt, func) {
    if (!this.listeners[evt]) return false
    var i = this.listeners[evt].indexOf(func)
    if (i === -1) return false
    this.listeners[evt].splice(i, 1)
    return true
  },

  /**
   * Trigger an event
   */
  trigger: function (evt) {
    if (!this.listeners[evt]) return
    var args = [].slice.call(arguments, 1)
    for (var i=0; i<this.listeners[evt].length; i++) {
      this.listeners[evt][i].apply(null, args)
    }
  },

  /**
   * Create bound versions of each action function for a given id
   *
   * @param {string} id this id ts sins things
   */
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

  importData: function (data) {
    var parent = this.view.getActive();
    if (parent === "new") {
        this.view.removeNew()
        parent = this.view.root
    }
    this.executeCommands('importData', [parent, 0, data])
    // this.model.createNodes(this.view.getActive(), 0, data)
    // this.view.rebase(this.view.root)
  },

  exportData: function () {
    return this.model.dumpData(this.model.root, true)
  },

  executeCommands: function () {
    if (arguments.length === 1 && Array.isArray(arguments[0])) {
      this.cmd.executeCommands.apply(this.cmd, arguments[0])
    } else {
      this.cmd.executeCommands.apply(this.cmd, arguments)
    }
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

    changeContent: function (id, content) {
      if (id === 'new') {
        if (!content) return
        var nw = this.view.removeNew()
        this.executeCommands('newNode', [nw.pid, nw.index, content, {}])
        return
      }
      this.executeCommands('changeContent', [id, content])
    },

    changed: function (id, attr, value) {
      if (id === 'new') {
        if (!value) return
        var nw = this.view.removeNew()
        var meta = {}
        meta[attr] = value
        this.executeCommands('newNode', [nw.pid, nw.index, '', meta])
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

    addBefore: function (id, text, focus) {
      if (id === this.view.root) return
      if (id === 'new') {
        // TODO: better behavior here
        return
      }
      var nw = this.model.idNew(id, true)
      this.executeCommands('newNode', [nw.pid, nw.index, text])
      if (focus) this.view.startEditing()
    },

    addAfter: function (id, text, focus) {
      var nw
      var ed = focus || this.view.mode === 'insert'
      // this.view.stopEditing()
      if (id === 'new') {
        // TODO: better behavior here

        nw = this.view.removeNew()
        this.executeCommands(
          'newNode', [nw.pid, nw.index+1, '']
        )
        if (ed) this.view.startEditing()
        return
      }
      if (id === this.view.root) {
        if (this.view.newNode) return this.view.startEditing('new')
        this.view.addNew(id, 0)
        this.view.startEditing('new')
        return
      }
      nw = this.model.idNew(id, false, this.view.root)
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


},{"./commandeger":2,"./util":16}],5:[function(_dereq_,module,exports){

module.exports = DefaultNode

var BaseNode = _dereq_('./base-node')

if (window.marked) {
  var renderer = new marked.Renderer()
  renderer.link = function (href, title, text) {
    return '<a href="' + href + '" target="_blank" title="' + title + '">' + text + '</a>';
  }
  marked.setOptions({
    gfm: true,
    sanitize: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    renderer: renderer
  })
}

function DefaultNode(content, meta, options, isNew) {
  BaseNode.call(this, content, meta, options, isNew)
}

DefaultNode.prototype = Object.create(BaseNode.prototype)
DefaultNode.prototype.constructor = DefaultNode

function tmerge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

function unEscapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/\u200b/g, '')
}

tmerge(DefaultNode.prototype, {
  setInputValue: function (value) {
    this.input.innerHTML = value
  },

  getInputValue: function () {
    return unEscapeHtml(this.input.innerHTML)
  },

  getVisibleValue: function () {
    return this.input.firstChild.textContent
  },

  isMultiLine: function () {
    return this.input.innerHTML.match(/(<div>|<br|\n)/g)
  },

  splitRightOfCursor: function () {
    var text = this.input.firstChild.textContent
      , s = this.getSelectionPosition()
      , left = escapeHtml(text.slice(0, s))
      , right = escapeHtml(text.slice(s))
    if (!right) return
    this.setInputValue(left)
    this.setTextContent(left)
    if (!this.isNew) this.o.changeContent(left)
    return right
  },

  setTextContent: function (value) {
    this.text.innerHTML = value ? marked(value + '') : ''
  },

  setupNode: function () {
    this.node = document.createElement('div')

    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.classList.add('treed__input')

    this.text = document.createElement('div')
    this.text.classList.add('treed__text')
    this.node.classList.add('treed__default-node')

    this.setTextContent(this.content)
    this.node.appendChild(this.text)
    this.registerListeners();
  },

  isAtTop: function () {
    var bb = this.input.getBoundingClientRect()
      , selr = window.getSelection().getRangeAt(0).getClientRects()[0]
    return selr.top < bb.top + 5
  },

  isAtBottom: function () {
    var bb = this.input.getBoundingClientRect()
      , selr = window.getSelection().getRangeAt(0).getClientRects()[0]
    return selr.bottom > bb.bottom - 5
  },

  getSelectionPosition: function () {
    var sel = window.getSelection()
      , ran = sel.getRangeAt(0)
    return ran.startOffset
  },

  startEditing: function (fromStart) {
    if (this.editing) return
    this.editing = true;
    this.setInputValue(this.content)
    this.node.replaceChild(this.input, this.text)
    this.input.focus();
    this.setSelection(!fromStart)
    this.o.setEditing()
  },

  stopEditing: function () {
    if (!this.editing) return
    console.log('stop eddint', this.isNew)
    var value = this.getInputValue()
    this.editing = false
    this.node.replaceChild(this.text, this.input)
    this.o.doneEditing();
    if (this.content != value || this.isNew) {
      this.setTextContent(value)
      this.content = value
      this.o.changeContent(this.content)
    }
  },

  isAtStart: function () {
    return this.getSelectionPosition() === 0
  },

  isAtEnd: function () {
    console.warn("THIS IS WRONG")
    return false
  },

  addEditText: function (text) {
    var pl = this.content.length
    this.content += text
    this.setInputValue(this.content)
    this.setTextContent(this.content)
    if (!this.editing) {
      this.editing = true;
      this.node.replaceChild(this.input, this.text)
      this.o.setEditing();
    }
    this.setSelection(pl)
  },

  setContent: function (content) {
    this.content = content
    this.setInputValue(content)
    this.setTextContent(content)
  },

  registerListeners: function () {
    this.text.addEventListener('mousedown', function (e) {
      if (e.target.nodeName == 'A') {
        return
      }
      this.startEditing();
      e.preventDefault()
      return false
    }.bind(this))

    this.input.addEventListener('blur', function (e) {
      this.stopEditing();
      e.preventDefault()
      return false
    }.bind(this));

    var keyHandler = this.keyHandler()

    this.input.addEventListener('keydown', function (e) {
      e.stopPropagation()
      return keyHandler(e)
    })

  },

  setSelection: function (end) {
    var sel = window.getSelection()
    sel.selectAllChildren(this.input)
    try {
      sel['collapseTo' + (end ? 'End' : 'Start')]()
    } catch (e) {}
  },

})


},{"./base-node":1}],6:[function(_dereq_,module,exports){

module.exports = DungeonsAndDragons

function findTarget(targets, e) {
  for (var i=0; i<targets.length; i++) {
    if (targets[i].top > e.clientY) {
      return targets[i > 0 ? i-1 : 0]
    }
  }
  return targets[targets.length-1]
}

// Manages Dragging N Dropping
function DungeonsAndDragons(vl, action, findFunction) {
  this.vl = vl
  this.action = action
  this.findFunction = findFunction || findTarget
}

DungeonsAndDragons.prototype = {
  startMoving: function (targets, id) {
    this.moving = {
      targets: targets,
      shadow: this.vl.makeDropShadow(),
      current: null
    }
    this.vl.setMoving(id, true)

    var onMove = function (e) {
      this.drag(id, e)
    }.bind(this)

    var onUp = function (e) {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      this.drop(id, e)
    }.bind(this)

    document.body.style.cursor = 'move'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  },

  drag: function (id, e) {
    if (this.moving.current) {
      this.vl.setDropping(this.moving.current.id, false, this.moving.current.place === 'child')
    }
    var target = this.findFunction(this.moving.targets, e)
    this.moving.shadow.moveTo(target)
    this.moving.current = target
    this.vl.setDropping(target.id, true, this.moving.current.place === 'child')
  },

  drop: function (id, e) {
    this.moving.shadow.remove()
    var current = this.moving.current
    this.vl.setMoving(id, false)
    if (!this.moving.current) return
    this.vl.setDropping(current.id, false, current.place === 'child')
    if (current.id === id) return
    this.action(current.place, id, current.id)
    this.moving = false
  },
}


},{}],7:[function(_dereq_,module,exports){

var DropShadow = _dereq_('./drop-shadow')
  , slideDown = _dereq_('./slide-down')
  , slideUp = _dereq_('./slide-up')
  , util = _dereq_('./util')

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
        place: 'before',
        show: {
          left: bc.left,// + 20,
          width: bc.width,// - 20,
          y: bc.top
        }
      }
      targets.push(target)
    }
    if (root === moving) return targets

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
  },

  animateOpen: function (id) {
    this.setCollapsed(id, false)
    slideDown(this.dom[id].ul)
  },

  animateClosed: function (id, done) {
    slideUp(this.dom[id].ul, function () {
      this.setCollapsed(id, true)
    }.bind(this))
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


},{"./drop-shadow":8,"./slide-down":14,"./slide-up":15,"./util":16}],8:[function(_dereq_,module,exports){

module.exports = DropShadow;

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


},{}],9:[function(_dereq_,module,exports){

module.exports = {
  Node: _dereq_('./default-node'),
  View: _dereq_('./view'),
  ViewLayer: _dereq_('./dom-vl'),
  Model: _dereq_('./model'),
  Controller: _dereq_('./controller'),
  pl: {
    Local: _dereq_('./local-pl'),
    Mem: _dereq_('./mem-pl')
  },
  skins: {
    wf: _dereq_('../skins/workflowy'),
    wb: _dereq_('../skins/whiteboard')
  }
}


},{"../skins/whiteboard":19,"../skins/workflowy":22,"./controller":4,"./default-node":5,"./dom-vl":7,"./local-pl":11,"./mem-pl":12,"./model":13,"./view":17}],10:[function(_dereq_,module,exports){

module.exports = keys

keys.keyName = keyName

var KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  27: 'escape',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  113: 'f2',
  219: '[',
  221: ']'
}

function keyName(code) {
  if (code <= 90 && code >= 65) {
    return String.fromCharCode(code + 32)
  }
  return KEYS[code]
}

function keys(config) {
  var kmap = {}
    , prefixes = {}
    , cur_prefix = null
    , parts
    , part
    , seq
  for (var key in config) {
    parts = key.split(',')
    for (var i=0;i<parts.length;i++) {
      part = parts[i].trim()
      kmap[part] = config[key]
      if (part.indexOf(' ') !== -1) {
        seq = part.split(/\s+/g)
        var n = ''
        for (var j=0; j<seq.length-1; j++) {
          n += seq[j]
          prefixes[n] = true
        }
      }
    }
  }
  return function (e) {
    var key = keyName(e.keyCode)
    if (!key) {
      return console.log(e.keyCode)
    }
    if (e.altKey) key = 'alt+' + key
    if (e.shiftKey) key = 'shift+' + key
    if (e.ctrlKey) key = 'ctrl+' + key
    if (e.metaKey) key = 'meta+' + key
    if (cur_prefix) {
      key = cur_prefix + ' ' + key
      cur_prefix = null
    }
    if (!kmap[key]) {
      if (prefixes[key]) {
        cur_prefix = key
      } else {
        cur_prefix = null
      }
      return
    }
    if (kmap[key].call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }
}



},{}],11:[function(_dereq_,module,exports){

module.exports = LocalPL

function LocalPL(opts) {
  this.prefix = (opts.prefix || 'local') + ':'
}

LocalPL.prototype = {
  init: function (done) {
    // XXX: are there any potential errors?
    done()
  },
  remote: false,
  canTrackUpdates: false,

  save: function (type, id, data, done) {
    localStorage[this.prefix + type + ':' + id] = JSON.stringify(data)
    done && done()
  },

  find: function (type, id, done) {
    var data
    try {
      data = JSON.parse(localStorage[this.prefix + type + ':' + id])
    } catch (e) {
      return done(e)
    }
    done(null, data)
  },

  update: function (type, id, update, done) {
    this.find(type, id, function (err, node) {

      if (err) return done(err)
      for (var attr in update) {
        node[attr] = update[attr]
      }
      this.save(type, id, node, done)
    }.bind(this))
  },

  remove: function (type, id, done) {
    delete localStorage[this.prefix + type + ':' + id]
    done && done()
  },

  findAll: function (type, done) {
    var items = []
      , data
    for (var key in localStorage) {
      if (key.indexOf(this.prefix + type + ':') !== 0) {
        continue;
      }
      try {
        data = JSON.parse(localStorage[key])
      } catch (e) {
        return done(e)
      }
      items.push(data)
    }
    done(null, items)
  },

  load: function (data, done, clear) {
    if (clear) {
      for (var key in localStorage) {
        if (key.indexOf(this.prefix) !== 0) {
          continue;
        }
        delete localStorage[key]
      }
    }
    for (var id in data.nodes) {
      localStorage[this.prefix + id] = JSON.stringify(data.nodes[id])
    }
    done && done()
  },

  dump: function (done) {
    var data = {}
      , item
    for (var key in localStorage) {
      if (this.prefix && key.indexOf(this.prefix) !== 0) {
        continue;
      }
      try {
        item = JSON.parse(localStorage[key])
      } catch (e) {
        console.warn("Failed to parse item", key, "while dumping")
        continue;
      }
      data[key.slice(this.prefix.length)] = item
    }
    done(null, {nodes: data})
  }
}


},{}],12:[function(_dereq_,module,exports){

module.exports = MemPL

function MemPL() {
  this.data = {}
}

MemPL.prototype = {
  init: function (done) {
    done()
  },

  save: function (type, id, data, done) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][id] = data
    done && done()
  },

  update: function (type, id, update, done) {
    for (var attr in update) {
      this.data[type][id][attr] = update[attr]
    }
    done && done()
  },

  findAll: function (type, done) {
    var items = []
    if (this.data[type]) {
      for (var id in this.data[type]) {
        items.push(this.data[type][id])
      }
    }
    done(null, items)
  },

  remove: function (type, id, done) {
    delete this.data[type][id]
    done && done()
  },

  load: function (data, done, clear) {
    done && done();
  },

  dump: function (done) {
    done(null, {nodes: {}});
  }
}


},{}],13:[function(_dereq_,module,exports){

module.exports = Model


function Model(root, ids, db) {
  this.ids = ids
  this.root = root
  this.db = db
  this.nextid = 100
  this.clipboard = false
}

/**
 * A single node is
 * - id:
 * - parent: id
 * - children: [id, id, id]
 * - data: {}
 */

Model.prototype = {
  newid: function () {
    while (this.ids[this.nextid]) {
      this.nextid += 1
    }
    var id = this.nextid
    this.nextid += 1
    return id
  },

  // export all the data currently stored in the model
  // dumpData() -> all of it
  // dumpData(id) -> children of the given id
  // dumpData(id, true) -> include the ids in the dump
  // {
  //    id: ??,
  //    meta: {},
  //    collapsed: ??,
  //    content: '',
  //    children: [recurse, ...]
  // }
  dumpData: function (id, noids) {
    if (arguments.length === 0) {
      id = this.root
    }
    var res = {
          meta: {},
        }
      , n = this.ids[id]
    res.content = n.content
    res.created = n.created
    res.type = n.type
    res.modified = n.modified
    for (var attr in n.meta) {
      res.meta[attr] = n.meta[attr]
    }
    if (n.children.length) {
      res.children = []
      for (var i=0; i<n.children.length; i++) {
        res.children.push(this.dumpData(n.children[i], noids))
      }
    }
    if (!noids) res.id = id
    res.collapsed = n.collapsed
    return res
  },

  // createNodes(parentId, the index, data as it was dumped)
  // {
  //    content: "",
  //    meta: {}
  //    ... other datas
  //    children: [node, ...]
  // }
  createNodes: function (pid, index, data) {
    var cr = this.create(pid, index, data.content, data.type, data.meta)
    cr.node.collapsed = data.collapsed
    if (data.children) {
      for (var i=0; i<data.children.length; i++) {
        this.createNodes(cr.node.id, i, data.children[i])
      }
    }
    return cr
  },

  getBefore: function (pid, index) {
    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }
    return before
  },

  // operations
  create: function (pid, index, text, type, meta) {
    var node = {
      id: this.newid(),
      content: text,
      type: type || 'base',
      meta: meta || {},
      parent: pid,
      children: []
    }
    this.ids[node.id] = node
    this.ids[pid].children.splice(index, 0, node.id)

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }

    this.db.save('node', node.id, node)
    this.db.update('node', pid, {children: this.ids[pid].children})

    return {
      node: node,
      before: before
    }
  },

  remove: function (id) {
    if (id === this.root) return
    var n = this.ids[id]
      , p = this.ids[n.parent]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    delete this.ids[id]

    this.db.remove('node', id)
    this.db.update('node', n.parent, {children: p.children})
    // TODO: remove all child nodes

    return {id: id, node: n, ix: ix}
  },

  setContent: function (id, content) {
    this.ids[id].content = content
    this.db.update('node', id, {content: content})
  },

  setAttr: function (id, attr, value) {
    this.ids[id].meta[attr] = value
    this.db.update('node', id, {meta: this.ids[id].meta})
  },

  setMeta: function (id, meta) {
    for (var attr in meta) {
      this.ids[id].meta[attr] = meta[attr]
    }
    this.db.update('node', id, {meta: meta})
  },

  // other stuff
  setCollapsed: function (id, isCollapsed) {
    this.ids[id].collapsed = isCollapsed
    this.db.update('node', id, {collapsed: isCollapsed})
  },

  isCollapsed: function (id) {
    return this.ids[id].collapsed
  },

  hasChildren: function (id) {
    return this.ids[id].children.length
  },

  // add back something that was removed
  readd: function (saved) {
    this.ids[saved.id] = saved.node
    var children = this.ids[saved.node.parent].children
    children.splice(saved.ix, 0, saved.id)
    var before = false
    if (saved.ix < children.length - 1) {
      before = children[saved.ix + 1]
    }
    this.db.save('node', saved.node.id, saved.node)
    this.db.update('node', saved.node.parent, {children: children})
    return before
  },

  move: function (id, pid, index) {
    var n = this.ids[id]
      , opid = n.parent
      , p = this.ids[opid]
      , ix = p.children.indexOf(id)
    p.children.splice(ix, 1)
    if (index === false) index = this.ids[pid].children.length
    this.ids[pid].children.splice(index, 0, id)
    this.ids[id].parent = pid

    this.db.update('node', opid, {children: p.children})
    this.db.update('node', pid, {children: this.ids[pid].children})
    this.db.update('node', id, {parent: pid})

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }
    return before
  },

  appendText: function (id, text) {
    this.ids[id].content += text
    this.db.update('node', id, {content: this.ids[id].content})
  },

  // movement calculation
  getParent: function (id) {
    return this.ids[id].parent
  },

  commonParent: function (one, two) {
    if (one === two) return one
    var ones = [one]
      , twos = [two]
    while (this.ids[one].parent || this.ids[two].parent) {
      if (this.ids[one].parent) {
        one = this.ids[one].parent
        if (twos.indexOf(one) !== -1) return one
        ones.push(one)
      }
      if (this.ids[two].parent) {
        two = this.ids[two].parent
        if (ones.indexOf(two) !== -1) return two
        twos.push(two)
      }
    }
    return null
  },

  getChild: function (id) {
    if (this.ids[id].children && this.ids[id].children.length) {
      return this.ids[id].children[0]
    }
    return this.nextSibling(id)
  },

  prevSibling: function (id, noparent) {
    var pid = this.ids[id].parent
    if (undefined === pid) return
    var ix = this.ids[pid].children.indexOf(id)
    if (ix > 0) return this.ids[pid].children[ix-1]
    if (!noparent) return pid
  },

  closestNonChild: function (id, others) {
    var closest = this.nextSibling(id, true)
    if (undefined === closest || closest === false) {
      if (others) {
        closest = this.idAbove(others[0])
      } else {
        closest = this.idAbove(id)
      }
    }
    return closest
  },

  nextSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return !strict && this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix < this.ids[pid].children.length - 1) return this.ids[pid].children[ix + 1]
    if (this.ids[id].collapsed) {
      return !strict && this.nextSibling(pid, strict)
    }
    return !strict && this.ids[id].children[0]
  },

  lastSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return !strict && this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === this.ids[pid].children.length - 1) return !strict && this.ids[id].children[0]
    return this.ids[pid].children[this.ids[pid].children.length - 1]
  },

  firstSibling: function (id, strict) {
    var pid = this.ids[id].parent
    if (undefined === pid) return // this.ids[id].children[0]
    var ix = this.ids[pid].children.indexOf(id)
    if (ix === 0) return !strict && pid
    return this.ids[pid].children[0]
  },

  lastOpen: function (id) {
    var node = this.ids[id]
    while (node.children.length && (node.id === id || !node.collapsed)) {
      node = this.ids[node.children[node.children.length - 1]]
    }
    return node.id
  },

  idAbove: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(+id)
    if (ix === 0) {
      return pid
    }
    var previd = parent.children[ix - 1]
    while (this.ids[previd].children &&
           this.ids[previd].children.length &&
           !this.ids[previd].collapsed) {
      previd = this.ids[previd].children[this.ids[previd].children.length - 1]
    }
    return previd
  },

  // get the place to shift left to
  shiftLeftPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ppid = parent.parent
      , pparent = this.ids[ppid]
    if (!pparent) return
    var pix = pparent.children.indexOf(pid)
    return {
      pid: ppid,
      ix: pix + 1
    }
  },

  shiftUpPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix === 0) {
      var pl = this.shiftLeftPlace(id)
      if (!pl) return
      pl.ix -= 1
      return pl
    }
    return {
      pid: pid,
      ix: ix - 1
    }
  },

  shiftDownPlace: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix >= parent.children.length - 1) {
      return this.shiftLeftPlace(id)
    }
    return {
      pid: pid,
      ix: ix + 1
    }
  },

  moveBeforePlace: function (id, tid) {
    var sib = this.ids[id]
      , pid = sib.parent
      , opid = this.ids[tid].parent
    if (undefined === pid) return
    var parent = this.ids[pid]
    return {
      pid: pid,
      ix: parent.children.indexOf(id)
    }
  },

  moveAfterPlace: function (id, oid) {
    var sib = this.ids[id]
      , pid = sib.parent
      , opid = this.ids[oid].parent
    if (undefined === pid) return
    var oix = this.ids[opid].children.indexOf(oid)
    var parent = this.ids[pid]
      , ix = parent.children.indexOf(id) + 1
    if ( pid === opid && ix > oix) ix -= 1
    return {
      pid: pid,
      ix: ix
    }
  },

  idBelow: function (id, root) {
    if (this.ids[id].children &&
        this.ids[id].children.length &&
        (id === root || !this.ids[id].collapsed)) {
      return this.ids[id].children[0]
    }
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    while (ix === parent.children.length - 1) {
      if (parent.id === root) return
      parent = this.ids[parent.parent]
      if (!parent) return
      ix = parent.children.indexOf(pid)
      pid = parent.id
    }
    return parent.children[ix + 1]
  },

  idNew: function (id, before, root) {
    var pid = this.ids[id].parent
      , parent
      , nix
    if (before) {
      parent = this.ids[pid]
      nix = parent.children.indexOf(id)
    } else if (id === this.root ||
        root === id ||
        (this.ids[id].children &&
        this.ids[id].children.length &&
        !this.ids[id].collapsed)) {
      pid = id
      nix = 0
    } else {
      parent = this.ids[pid]
      nix = parent.children.indexOf(id) + 1
    }
    return {
      pid: pid,
      index: nix
    }
  },

  samePlace: function (id, place) {
    var pid = this.ids[id].parent
    if (!pid || pid !== place.pid) return false
    var parent = this.ids[pid]
      , ix = parent.children.indexOf(id)
    return ix === place.ix
  },

  findCollapser: function (id) {
    if ((!this.ids[id].children ||
         !this.ids[id].children.length ||
         this.ids[id].collapsed) &&
        this.ids[id].parent !== undefined) {
      id = this.ids[id].parent
    }
    return id
  },
}


},{}],14:[function(_dereq_,module,exports){

module.exports = function slideDown(node) {
  var style = window.getComputedStyle(node)
    , height = style.height
  if (!parseInt(height)) {
    return
  }
  node.style.height = 0
  node.style.transition = 'height .2s ease'
  node.style.overflow = 'hidden'
  console.log(height)

  setTimeout(function () {
    console.log('y', height)
    node.style.height = height
  }, 0)

  node.addEventListener('transitionend', fin)
  function fin() {
    node.removeEventListener('transitionend', fin)
    node.style.removeProperty('transition')
    node.style.removeProperty('height')
    node.style.removeProperty('overflow')
  }
}


},{}],15:[function(_dereq_,module,exports){

module.exports = function slideUp(node, done) {
  /*
  animate(node, {
    height: {
      from: 'current',
      to: 0
    }
  }, done)
  */
  var style = window.getComputedStyle(node)
    , height = style.height
  if (!parseInt(height)) {
    return
  }
  node.style.height = height
  node.style.transition = 'height .2s ease'
  node.style.overflow = 'hidden'

  setTimeout(function () {
    node.style.height = 0
  }, 0)

  node.addEventListener('transitionend', fin)
  function fin() {
    node.removeEventListener('transitionend', fin)
    node.style.removeProperty('transition')
    node.style.removeProperty('height')
    node.style.removeProperty('overflow')
    done()
  }
}

},{}],16:[function(_dereq_,module,exports){

module.exports = {
  extend: extend,
  merge: merge,
  ensureInView: ensureInView,
  make_listed: make_listed
}

function merge(a, b) {
  var c = {}
    , d
  for (d in a) {
    c[d] = a[d]
  }
  for (d in b) {
    c[d] = b[d]
  }
  return c
}

function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function extend(dest) {
  [].slice.call(arguments, 1).forEach(function (src) {
    for (var attr in src) {
        dest[attr] = src[attr]
    }
  })
  return dest
}

function load(db, tree) {
  var res = make_listed(tree, undefined, true)
  db.save('root', {id: res.id})
  for (var i=0; i<res.tree.length; i++) {
    db.save('node', res.tree[i])
  }
}

function make_listed(data, nextid, collapse) {
  var ids = {}
    , children = []
    , ndata = {}
    , res
    , i
  if (undefined === nextid) nextid = 100

  if (data.children) {
    for (i=0; i<data.children.length; i++) {
      res = make_listed(data.children[i], nextid, collapse)
      for (var id in res.tree) {
        ids[id] = res.tree[id]
        ids[id].depth += 1
      }
      children.push(res.id)
      nextid = res.id + 1
    }
    // delete data.children
  }
  for (var attr in data) {
    if (attr === 'children') continue;
    ndata[attr] = data[attr]
  }
  ndata.done = false
  var theid = data.id || nextid
  ids[theid] = {
    id: theid,
    data: ndata,
    children: children,
    collapsed: !!collapse,
    depth: 0
  }
  for (i=0; i<children.length; i++) {
    ids[children[i]].parent = theid;
  }
  return {id: theid, tree: ids}
}


},{}],17:[function(_dereq_,module,exports){

module.exports = View

function reversed(items) {
  var nw = []
  for (var i=items.length; i>0; i--) {
    nw.push(items[i - 1])
  }
  return nw
}

var DomViewLayer = _dereq_('./dom-vl')
  , DefaultNode = _dereq_('./default-node')
  , DungeonsAndDragons = _dereq_('./dnd')
  , keys = _dereq_('./keys')
  , util = _dereq_('./util')

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
    noSelectRoot: false,
    animate: true
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
      this.ctrl.addBefore(this.active, '', true)
    },

    'new after': function () {
      if (this.active === null) return
      if (this.active === 'new') return this.startEditing()
      this.ctrl.actions.addAfter(this.active, '', true)
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
    if (what) {
      if (this.mode === 'insert') {
        this.startEditing(id)
      } else {
        this.setActive(id)
      }
      if (this.o.animate) {
        this.vl.animateClosed(id)
      } else {
        this.vl.setCollapsed(id, true)
      }
    } else {
      if (this.lazy_children[id]) {
        this.populateChildren(id)
      }
      if (this.o.animate) {
        this.vl.animateOpen(id)
      } else {
        this.vl.setCollapsed(id, false)
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


},{"./default-node":5,"./dnd":6,"./dom-vl":7,"./keys":10,"./util":16}],18:[function(_dereq_,module,exports){

module.exports = Block

function unEscapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/\u200b/g, '')
}

/**
 * Config looks like:
 * {
 *   top: num,
 *   left: num, (from meta.whiteboard)
 *  }
 * Options looks like:
 * {
 *  saveConfig
 *  saveContent
 *  changeContent
 *  startMoving(event, rect, ?shiftMove)
 *  startMovingChild(event, id, ?shiftMove)
 *  onZoom
 * }
 */
function Block(data, children, config, options) {
  this.o = options
  this.editing = false
  this._moved = false
  this.setupNode(data, children)
  this.reposition(config.left, config.top, true)
  // this.resize(config.width, config.height, true)
}

Block.prototype = {
  setupNode: function (data, children) {
    this.node = document.createElement('div')
    this.node.className = 'whiteboard-item'
    // this.node.addEventListener('mousedown', this._onMouseDown.bind(this))
    this.node.addEventListener('mouseup', this._onMouseUp.bind(this))
    this.node.addEventListener('mousemove', this._onMouseMove.bind(this))
    this.node.addEventListener('mousedown', this._onMouseDown.bind(this))

    this.title = document.createElement('div')
    this.title.className='whiteboard-item_title'
    // this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('dblclick', this.o.onZoom)

    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.className = 'whiteboard-item_input'
    this.input.addEventListener('blur', this._onBlur.bind(this))

    this.body = document.createElement('ul')
    this.body.className='whiteboard-item_body'

    var zoom = document.createElement('div')
    zoom.className = 'whiteboard-item_zoom'
    zoom.innerHTML = '<i class="fa fa-expand"/>'
    zoom.addEventListener('click', this.o.onZoom)

    this.children = {}

    children.forEach(function (child) {
      var node = this.createChild(child)
      // node.addEventListener('mousedown', this._onMouseDownChild.bind(this, child.id))
      this.body.appendChild(node)
      this.children[child.id] = node
    }.bind(this))

    /*
    this.footer = document.createElement('div')
    this.footer.className = 'whiteboard-item_footer'
    var zoom = document.createElement('i')
    zoom.className = 'fa fa-expand zoom'
    zoom.addEventListener('click', this.o.onZoom)
    this.footer.appendChild(zoom)
    */

    this.node.appendChild(this.title)
    this.node.appendChild(this.body)
    this.node.appendChild(zoom)
    // this.node.appendChild(this.footer)

    this.setTextContent(data.content)
    this.content = data.content
    return this.node
  },

  remove: function () {
    this.node.parentNode.removeChild(this.node)
    return true
  },

  /**
   * pid: the id of this block
   * cid: the child that is being moved
   * children: list of child ids
   */
  getChildTargets: function (cid, bid, children) {
    var targets = children ? children.map(this.childTarget.bind(this, bid)) : []
    targets.push(this.wholeTarget(bid, children.length))
    return targets
  },

  childTarget: function (pid, id, i) {
    var box = this.children[id].getBoundingClientRect()
      , magic = 10
    return {
      hit: {
        left: box.left,
        right: box.right,
        top: box.top - magic,
        bottom: box.bottom - magic
      },
      pos: i,
      pid: pid,
      draw: {
        left: box.left,
        width: box.width,
        top: box.top - magic/2,
        height: magic
      }
    }
  },

  /**
   * id: the box id
   * last: the last index in the child list
   */
  wholeTarget: function (id, last) {
    var box = this.node.getBoundingClientRect()
      , magic = 10
    return {
      hit: box,
      pid: id,
      pos: last,
      draw: {
        top: box.bottom - magic,
        left: box.left + magic/2,
        height: magic,
        width: box.width - magic
      }
    }
  },


  // Children!!


  // Not children!!

  updateConfig: function (config) {
    this.reposition(config.left, config.top, true)
    // this.resize(config.width, config.height, true)
  },

  setContent: function (content) {
    if (content === this.content) return
    this.setTextContent(content)
    this.setInputValue(content)
  },

  _onBlur: function (e) {
    this.stopEditing()
    e.preventDefault()
    return false
  },

  _onMouseMove: function (e) {
    if (e.target.classList.contains('handle')) {
      return
    }
    if (!e.shiftKey) return
    var rect = this.node.getBoundingClientRect()
    if (this.o.startMoving(e, rect, true)) {
      this.node.classList.add('whiteboard-item--moving')
    }
  },

  _onMouseUp: function (e) {
  },

  _onClick: function (e) {
    if (this._moved) {
      this._moved = false
      return
    }
    this.startEditing()
    e.preventDefault()
    return false
  },

  _onMouseMoveChild: function (id, e) {
    if (!e.shiftKey) return
    e.preventDefault()
    var clone = this.children[id].lastChild.cloneNode(true)
    if (this.o.startMovingChild(e, id, clone, true)) {
      this.children[id].classList.add('whiteboard-item_child--moving')
    }
  },

  _onMouseDownChild: function (id, e) {
    e.stopPropagation()
    e.preventDefault()
    var clone = this.children[id].lastChild.cloneNode(true)
    if (this.o.startMovingChild(e, id, clone)) {
      this.children[id].classList.add('whiteboard-item_child--moving')
    }
  },

  _onMouseDown: function (e) {
    if (e.button !== 0) {
      return
    }
    this._moved = false
    if (e.target !== this.input) {
      e.preventDefault()
      document.activeElement.blur()
    }
    var rect = this.node.getBoundingClientRect()
    this.node.classList.add('whiteboard-item--moving')
    this.o.startMoving(e, rect)
      //, top = e.clientY - rect.top
      //, left = e.clientX - rect.left
    /**
     * TODO: resizability ?
    if (left > rect.width - 10) {
      return this.startResizing('x')
    }
    if (top > rect.height - 10) {
      return this.startResizing('y')
    }
     */
    //this.o.startMoving(left, top)
    return false
  },

  removeChild: function (id) {
    if (!this.children[id]) {
      return false
    }
    this.children[id].parentNode.removeChild(this.children[id])
    delete this.children[id]
  },

  addChild: function (child, id, before) {
    var node = this.createChild(child)
    if (before === false) {
      this.body.appendChild(node)
    } else {
      this.body.insertBefore(node, this.children[before])
    }
    this.children[id] = node
  },

  createChild: function (child) {
    var node = document.createElement('li')
    node.className='whiteboard-item_child'
    if (child.children && child.children.length) {
      node.classList.add('whiteboard-item_child--parent')
    }
    var body = document.createElement('div')
    body.innerHTML = child.content ? marked(child.content) : '<em>Click here to edit</em>'
    var handle = document.createElement('div')
    handle.className = 'handle'
    handle.innerHTML = '<i class="fa fa-circle"/>'
    handle.addEventListener('mousemove', this._onMouseMoveChild.bind(this, child.id))
    handle.addEventListener('mousedown', this._onMouseDownChild.bind(this, child.id))
    node.appendChild(handle)
    node.appendChild(body)
    return node
  },

  doneMoving: function () {
    this.node.classList.remove('whiteboard-item--moving')
  },

  doneMovingChild: function (id) {
    this.children[id].classList.remove('whiteboard-item_child--moving')
  },

  startEditing: function (fromStart) {
    if (this.editing) return
    this.node.classList.add('whiteboard-item--editing')
    this.editing = true;
    this.setInputValue(this.content)
    this.node.replaceChild(this.input, this.title)
    this.input.focus();
    this.setSelection(!fromStart)
  },

  stopEditing: function () {
    if (!this.editing) return
    this.node.classList.remove('whiteboard-item--editing')
    console.log('stop eddint', this.isNew)
    var value = this.getInputValue()
    this.editing = false
    this.node.replaceChild(this.title, this.input)
    if (this.content != value) {
      this.setTextContent(value)
      this.content = value
      this.o.changeContent(this.content)
    }
  },

  setSelection: function (end) {
    var sel = window.getSelection()
    sel.selectAllChildren(this.input)
    try {
      sel['collapseTo' + (end ? 'End' : 'Start')]()
    } catch (e) {}
  },

  focus: function () {
    this.startEditing()
  },

  setTextContent: function (value) {
    this.title.innerHTML = value ? marked(value) : ''
  },

  setInputValue: function (value) {
    this.input.innerHTML = value
  },

  getInputValue: function () {
    return unEscapeHtml(this.input.innerHTML)
  },

  reposition: function (x, y, silent) {
    if (x !== this.x || y !== this.y) {
      this._moved = true
    }
    this.x = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
    if (!silent) {
      this.saveConfig()
    }
  },

  resize: function (width, height, silent) {
    this.width = width
    this.height = height
    this.node.style.width = width + 'px'
    this.node.style.height = height + 'px'
    if (!silent) {
      this.saveConfig()
    }
  },

  saveConfig: function () {
    this.o.saveConfig({
      left: this.x,
      top: this.y,
      width: this.width,
      height: this.height
    })
  },

  saveContent: function () {
    this.o.saveContent(this.content)
  },

  mouseMove: function (e) {
  },

  mouseUp: function (e) {
  },

  click: function (e) {
    this.startEditing()
  },

  blur: function () {
    this.stopEditing()
  },

  keyDown: function (e) {
  }
}


},{}],19:[function(_dereq_,module,exports){

module.exports = {
  View: _dereq_('./view')
}


},{"./view":20}],20:[function(_dereq_,module,exports){

var DungeonsAndDragons = _dereq_('../../lib/dnd.js')
var Block = _dereq_('./block')

module.exports = View

function View(bindActions, model, ctrl, options) {
  this.mode = 'normal'
  this.active = null
  this.ids = {}

  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl

  this._boundMove = this._onMouseMove.bind(this)
  this._boundUp = this._onMouseUp.bind(this)
  document.addEventListener('keyup', this._onKeyUp.bind(this))
}

View.prototype = {
  initialize: function (root) {
    var node = this.model.ids[root]
    this.setupRoot()
    this.root = root
    this.makeBlocks(root)
    return this.rootNode
  },

  setupRoot: function () {
    var rootNode = document.createElement('div')
    rootNode.className='whiteboard'
    rootNode.addEventListener('click', this._onClick.bind(this))
    rootNode.addEventListener('mousedown', this._onMouseDown.bind(this))
    rootNode.addEventListener('wheel', this._onWheel.bind(this))

    this.head = document.createElement('div')
    this.head.className = 'whiteboard-head'
    this.head.addEventListener('click', this._onClickHead.bind(this))

    this.input = document.createElement('input')
    this.input.setAttribute('contenteditable', true)
    this.input.className = 'whiteboard-input-head'
    this.input.addEventListener('blur', this._onBlurHead.bind(this))

    this.container = document.createElement('div')
    this.container.className = 'whiteboard-container'

    this.controls = document.createElement('div')
    this.controls.className = 'whiteboard-controls'
    var b1 = document.createElement('button')
    b1.innerHTML = '1:1'
    b1.addEventListener('click', this.resetContainer.bind(this))
    var b2 = document.createElement('button')
    b2.innerHTML = '<i class="fa fa-th-large"/>'
    b2.addEventListener('click', this.resetPositions.bind(this))
    this.controls.appendChild(b1)
    this.controls.appendChild(b2)

    this.dropShadow = document.createElement('div')
    this.dropShadow.className = 'whiteboard-dropshadow'

    this.body = document.createElement('div')
    this.body.appendChild(this.container)
    this.body.className = 'whiteboard-body'
    this.body.addEventListener('dblclick', this._onDoubleClick.bind(this))

    this.vline = document.createElement('div')
    this.vline.className='whiteboard_vline'
    this.hline = document.createElement('div')
    this.hline.className='whiteboard_hline'
    this.body.appendChild(this.vline)
    this.body.appendChild(this.hline)
    this.body.appendChild(this.dropShadow)
    this.body.appendChild(this.controls)

    rootNode.appendChild(this.head)
    rootNode.appendChild(this.body)

    this.rootNode = rootNode
    this.setContainerZoom(1)
    this.setContainerPos(0, 0)
  },

  // Controller / Commands API stuff

  getActive: function () {
    return this.root
  },

  addTree: function (node, before) {
    if (node.parent !== this.root) return;
    this.makeBlock(node.id, 0)
  },

  add: function (node, before, dontfocus) {
    if (node.parent === this.root) {
      var block = this.makeBlock(node.id, 0)
      block.node.style.zIndex = Object.keys(this.ids).length
      if (!dontfocus) {
        block.focus()
      }
      return
    }
    if (!this.ids[node.parent]) {
      return
    }
    this.ids[node.parent].addChild(node, this.model)
  },

  setCollapsed: function () {
  },
  startEditing: function () {
  },
  setActive: function () {
  },
  setSelection: function () {
  },

  move: function (id, pid, before, opid, lastchild) {
    if (this.ids[opid]) {
      this.ids[opid].removeChild(id)
    } else if (opid == this.root) {
      this.ids[id].remove()
      delete this.ids[id]
    }
    if (this.ids[pid]) {
      return this.ids[pid].addChild(this.model.ids[id], id, before)
    }
    if (pid !== this.root) {
      return
    }
    this.add(this.model.ids[id], before)
  },

  remove: function (id) {
    console.warn("FIX??")
    this.container.removeChild(this.ids[id].node)
    delete this.ids[id]
  },
  goTo: function () {
    console.warn('FIX!');
  },
  clear: function () {
    for (var id in this.ids) {
      this.container.removeChild(this.ids[id].node)
    }
    this.ids = {}
    this.setContainerPos(0, 0)
    this.setContainerZoom(1);
  },

  rebase: function (newroot, trigger) {
    this.clear()
    this.root = newroot
    this.makeBlocks(newroot)
    this.ctrl.trigger('rebase', newroot)
  },

  setAttr: function (id, attr, value) {
    if (!this.ids[id]) {
      return
    }
    if (attr === 'whiteboard') {
      if (!value || !value.top) {
        var ch = this.model.ids[this.root].children
          , i = ch.indexOf(id)
          , defaultWidth = 300
          , defaultHeight = 100
          , margin = 10
        value = {
          top: 10 + parseInt(i / 4) * (defaultHeight + margin),
          left: 10 + (i % 4) * (defaultWidth + margin)
        }
      }
      this.ids[id].updateConfig(value)
    }
    // TODO something with done-ness?
  },

  setContent: function (id, content) {
    if (!this.ids[id]) {
      return
    }
    this.ids[id].setContent(content)
  },

  setRootContent: function (content) {
    this.head.innerHTML = marked(content);
  },

  makeBlocks: function (root) {
    this.setRootContent(this.model.ids[root].content);
    var children = this.model.ids[root].children
    if (!children) return
    children.forEach(this.makeBlock.bind(this));
  },

  makeBlock: function (id, i) {
    var node = this.model.ids[id]
      , config = node.meta.whiteboard
      // TODO: magic numbers?
      , defaultWidth = 300
      , defaultHeight = 100
      , margin = 10
    if (!config) {
      config = {
        // width: 200,
        // height: 200,
        top: 10 + parseInt(i / 4) * (defaultHeight + margin),
        left: 10 + (i % 4) * (defaultWidth + margin)
      }
    }
    var children = (node.children || []).map(function (id) {
      return this.model.ids[id]
    }.bind(this));
    var block = new Block(node, children, config, {
      saveConfig: function (config) {
        this.ctrl.executeCommands('changeNodeAttr', [node.id, 'whiteboard', config]);
      }.bind(this),
      saveContent: function (content) {
        this.ctrl.executeCommands('changeContent', [node.id, content]);
      }.bind(this),
      changeContent: function (content) {
        this.ctrl.executeCommands('changeContent', [node.id, content]);
      }.bind(this),
      startMoving: this._onStartMoving.bind(this, node.id),
      startMovingChild: this._onStartMovingChild.bind(this, node.id),
      onZoom: function () {
        this.rebase(node.id)
      }.bind(this),
    })
    this.ids[id] = block
    this.container.appendChild(block.node)
    return block
  },

  /**
   * If the current is over a target, show the drop shadow.
   */
  updateDropTarget: function (x, y) {
    var t
    /*
    if (this.moving.currentTarget) {
      t = this.moving.currentTarget
      if (x >= t.hit.left && x <= t.hit.right &&
          y >= t.hit.top && y <= t.hit.bottom) {
        // just keep the current one
        return
      }
    }
    */
    for (var i=0; i<this.moving.targets.length; i++) {
      t = this.moving.targets[i]
      if (x >= t.hit.left && x <= t.hit.right &&
          y >= t.hit.top && y <= t.hit.bottom) {
        this.moving.currentTarget = t
        this.showDropShadow(t.draw)
        return true
      }
    }
    this.moving.currentTarget = null
    this.hideDropShadow()
    return false
  },

  /**
   * Collect a list of targets 
   */
  findTargets: function (children, id, isChild) {
    var targets = []
      , snaps = []
      , root = this.body.getBoundingClientRect()
    for (var i = children.length - 1; i >= 0; i--) {
      if (id == children[i]) continue;
      var childids = this.model.ids[children[i]].children
        , child = this.ids[children[i]]
        , whole = child.wholeTarget(id, childids.length)
      targets = targets.concat(child.getChildTargets(id, children[i], childids))
      targets.push(whole)
      if (!isChild) {
        snaps.push({
          top: whole.hit.top - root.top,
          left: whole.hit.left - root.left,
          right: whole.hit.right - root.left,
          bottom: whole.hit.bottom - root.top
        })
      }
    }
    return {
      targets: targets,
      snaps: snaps
    }
  },

  trySnap: function (x, y) {
    // convert to screen coords
    x = x * this._zoom + this.x
    y = y * this._zoom + this.y
    var h = this.moving.height
      , w = this.moving.width
      , b = y + h
      , r = x + w
      , allowance = 20 * this._zoom
      , space = 10 * this._zoom

    if (allowance < 2) {
      return false
    }

    // TODO: show guiding lines
    var lines = []
      , dx = false
      , dy = false

    this.moving.snaps.forEach(function (snap) {
      if (!dy) {
        // top
        if (Math.abs(snap.top - space - b) < allowance) {
          y = snap.top - space - h
          dy = [snap.left, snap.right, snap.top - space / 2]
        } else if (Math.abs(snap.top - y) < allowance) {
          y = snap.top
          dy = [snap.left, snap.right, snap.top - space / 2]
        } else if (Math.abs(snap.bottom + space - y) < allowance) { // bottom
          y = snap.bottom + space
          dy = [snap.left, snap.right, snap.bottom + space / 2]
        } else if (Math.abs(snap.bottom - b) < allowance) {
          y = snap.bottom - h
          dy = [snap.left, snap.right, snap.bottom + space / 2]
        }
      }

      if (!dx) {
        // left
        if (Math.abs(snap.left - space - r) < allowance) {
          x = snap.left - space - w
          dx = [snap.top, snap.bottom, snap.left - space / 2]
        } else if (Math.abs(snap.left - x) < allowance) {
          x = snap.left
          dx = [snap.top, snap.bottom, snap.left - space / 2]
        } else if (Math.abs(snap.right + space - x) < allowance) { // right
          x = snap.right + space
          dx = [snap.top, snap.bottom, snap.right + space / 2]
        } else if (Math.abs(snap.right - r) < allowance) {
          x = snap.right - w
          dx = [snap.top, snap.bottom, snap.right + space / 2]
        }
      }
    })

    if (dx) {
      var ht = Math.min(dx[0], y)
        , hb = Math.max(dx[1], y + h)
      this.vline.style.left = dx[2] - 1 + 'px'
      this.vline.style.top = ht - space/2 + 'px'
      this.vline.style.height = (hb - ht) + space + 'px'
      this.vline.style.display = 'block'
    } else {
      this.vline.style.display = 'none'
    }

    if (dy) {
      var vl = Math.min(dy[0], x)
        , vr = Math.max(dy[1], x + w)
      this.hline.style.top = dy[2] - 1 + 'px'
      this.hline.style.left = vl - space/2 + 'px'
      this.hline.style.width = (vr - vl) + space + 'px'
      this.hline.style.display = 'block'
    } else {
      this.hline.style.display = 'none'
    }

    if (dx || dy) {
      return {
        x: (x - this.x)/this._zoom,
        y: (y - this.y)/this._zoom
      }
    }
    return false
  },

  getByZIndex: function () {
    var items = [];
    for (var id in this.ids) {
      items.push([+this.ids[id].node.style.zIndex, id])
    }
    items.sort(function (a, b) {
      return a[0] - b[0]
    })
    return items.map(function (item) {return item[1]})
  },

  shuffleZIndices: function (top) {
    var items = this.getByZIndex()
    for (var i=0; i<items.length; i++) {
      this.ids[items[i]].node.style.zIndex = i
    }
    this.ids[top].node.style.zIndex = items.length
    return items
  },

  // event handlers

  _onClickHead: function (e) {
    e.preventDefault()
    this.startEditing()
  },

  _onBlurHead: function (e) {
    e.preventDefault()
    this.stopEditing()
  },

  startEditing: function () {
    this.input.value = this.model.ids[this.root].content
    this.rootNode.replaceChild(this.input, this.head)
    this.input.focus()
    this.input.selectionStart = this.input.selectionEnd = this.input.value.length
  },

  stopEditing: function () {
    this.ctrl.executeCommands('changeContent', [this.root, this.input.value])
    this.setRootContent(this.input.value)
    this.rootNode.replaceChild(this.head, this.input)
  },

  _onClick: function (e) {
    if (e.target === this.rootNode) {
      document.activeElement.blur()
    }
  },

  _onDoubleClick: function (e) {
    if (e.target !== this.body) {
      return
    }
    var box = this.container.getBoundingClientRect()
    var x = e.clientX - 50 - box.left
      , y = e.clientY - 10 - box.top
      , idx = this.model.ids[this.root].children.length
    this.ctrl.executeCommands('newNode', [this.root, idx, '', {
      whiteboard: {
        // width: 200,
        // height: 200,
        top: y,
        left: x
      }
    }]);
  },

  _onWheel: function (e) {
    e.preventDefault()
    if (this.moving) {
      return
    }
    var x, y
    var deltaX = -e.deltaX, deltaY = -e.deltaY
    if (e.shiftKey) {
      var root = this.body.getBoundingClientRect()
      x = e.clientX - root.left
      y = e.clientY - root.top
      this.zoomMove((deltaY / 500), x, y)
      return
    }
    x = this.x
    y = this.y
    this.setContainerPos(x + deltaX, y + deltaY)
  },

  _onMouseDown: function (e) {
    if (e.target !== this.rootNode) {
      return
    }
    var box = this.container.getBoundingClientRect()
    var x = e.clientX - box.left
      , y = e.clientY - box.top
    this.moving = {
      x: x,
      y: y,
    }
    e.preventDefault()
    document.addEventListener('mousemove', this._boundMove)
    document.addEventListener('mouseup', this._boundUp)
  },

  _onStartMoving: function (id, e, rect, shiftMove) {
    if (this.moving) return false;
    var y = e.clientY / this._zoom - rect.top/this._zoom
      , x = e.clientX / this._zoom - rect.left/this._zoom
    var children = this.shuffleZIndices(id)
    var boxes = this.findTargets(children, id)
    this.moving = {
      shift: shiftMove,
      targets: boxes.targets,
      snaps: boxes.snaps,
      width: rect.width,
      height: rect.height,
      atx: this.ids[id].x,
      aty: this.ids[id].y,
      id: id,
      x: x,
      y: y,
    }
    document.addEventListener('mousemove', this._boundMove)
    document.addEventListener('mouseup', this._boundUp)
    this.rootNode.classList.add('whiteboard--moving')
    return true
  },

  _onStartMovingChild: function (id, e, cid, handle, shiftMove) {
    if (this.moving) return false;
    var box = this.container.getBoundingClientRect()
    var x = e.clientX/this._zoom - box.left/this._zoom
      , y = e.clientY/this._zoom - box.top/this._zoom
    var children = this.getByZIndex()
    var boxes = this.findTargets(children, cid, true)
    this.moving = {
      shift: shiftMove,
      targets: boxes.targets,
      snaps: boxes.snaps,
      handle: handle,
      child: cid,
      parent_id: id,
      oty: x,
      otx: y,
      x: x,
      y: y
    }
    this.container.appendChild(handle)
    this.updateDropTarget(e.clientX, e.clientY)
    handle.className = 'whiteboard_child-handle'
    handle.style.top = y + 'px'
    handle.style.left = x + 'px'
    document.addEventListener('mousemove', this._boundMove)
    document.addEventListener('mouseup', this._boundUp)
    this.rootNode.classList.add('whiteboard--moving')
    return true
  },

  _onKeyUp: function (e) {
    if (e.keyCode === 16 && this.moving && this.moving.shift) {
      this.stopMoving()
    }
  },

  _onMouseMove: function (e) {
    if (!this.moving) {
      return this._onMouseUp(e)
    }
    e.preventDefault()

    if (this.moving.child) {
      var box = this.container.getBoundingClientRect()
      var x = e.clientX/this._zoom - box.left/this._zoom
        , y = e.clientY/this._zoom - box.top/this._zoom
      this.moving.handle.style.top = y + 'px'
      this.moving.handle.style.left = x + 'px'
      this.moving.x = x
      this.moving.y = y
      this.updateDropTarget(e.clientX, e.clientY)
      return false
    }

    if (this.moving.id) {
      var box = this.container.getBoundingClientRect()
      var x = e.clientX/this._zoom - box.left/this._zoom - this.moving.x
        , y = e.clientY/this._zoom - box.top/this._zoom - this.moving.y
      if (!this.updateDropTarget(e.clientX, e.clientY)) {
        // no drop place was found, let's snap!
        var pos = this.trySnap(x, y)
        if (pos) {
          x = pos.x
          y = pos.y
        }
      }
      this.moving.atx = x
      this.moving.aty = y
      this.ids[this.moving.id].reposition(x, y, true)
      return false
    } 

    // dragging the canvas
    var box = this.body.getBoundingClientRect()
    var x = e.clientX - box.left - this.moving.x
      , y = e.clientY - box.top - this.moving.y
    this.setContainerPos(x, y)
    return false
  },

  _onMouseUp: function (e) {
    e.preventDefault()
    this.stopMoving()
    return false
  },

  resetContainer: function () {
    this.setContainerPos(0, 0)
    this.setContainerZoom(1)
  },

  resetPositions: function () {
    var cmds = []
    this.model.ids[this.root].children.forEach(function (id) {
      cmds.push('changeNodeAttr')
      cmds.push([id, 'whiteboard', null])
    });
    this.ctrl.executeCommands(cmds)
  },

  zoomMove: function (delta, x, y) {
    var next = this._zoom * delta
      , nz = this._zoom + next
      , scale = this._zoom / nz
      , nx = x - x / scale
      , ny = y - y / scale
    this.setContainerPos(this.x/scale + nx, this.y/scale + ny)
    this.setContainerZoom(nz)
  },

  setContainerZoom: function (num) {
    this._zoom = num
    this.container.style.WebkitTransform = 'scale(' + num + ')'
    this.container.style.transform = 'scale(' + num + ')'
  },

  setContainerPos: function (x, y) {
    this.x = x
    this.y = y
    this.container.style.left = x + 'px'
    this.container.style.top = y + 'px'
  },

  // other stuff

  stopMovingChild: function () {
    // TODO move into
    this.moving.handle.parentNode.removeChild(this.moving.handle)
    var pos = this.model.ids[this.root].children.length

    if (this.moving.currentTarget) {
      var pos = this.moving.currentTarget.pos
      if (this.moving.currentTarget.pid == this.moving.parent_id) {
        if (pos > this.model.ids[this.moving.parent_id].children.indexOf(this.moving.child)) {
          pos -= 1
        }
      }
      this.ctrl.executeCommands('move', [
        this.moving.child,
        this.moving.currentTarget.pid,
        pos
      ], 'changeNodeAttr', [
        this.moving.child,
        'whiteboard',
        null
      ]);
    } else {

      this.ctrl.executeCommands('changeNodeAttr', [
        this.moving.child,
        'whiteboard',
        {top: this.moving.y, left: this.moving.x}
      ], 'move', [
        this.moving.child,
        this.root,
        pos
      ])

    }

    this.ids[this.moving.parent_id].doneMoving()
  },

  showDropShadow: function (rect) {
    var box = this.body.getBoundingClientRect()
      , realheight = rect.height * this._zoom
      , yoff = (rect.height - realheight) / 2
    this.dropShadow.style.top = rect.top - box.top + yoff + 'px'
    this.dropShadow.style.left = rect.left - box.left + 'px'
    this.dropShadow.style.width = rect.width + 'px'
    this.dropShadow.style.height = realheight + 'px'
    this.dropShadow.style.display = 'block'
  },

  hideDropShadow: function () {
    this.dropShadow.style.display = 'none'
  },

  stopMovingMain: function () {
    this.ids[this.moving.id].reposition(this.moving.atx, this.moving.aty)
    this.ids[this.moving.id].doneMoving()
    if (this.moving.currentTarget) {
      this.ctrl.executeCommands('move', [
        this.moving.id,
        this.moving.currentTarget.pid,
        this.moving.currentTarget.pos
      ], 'changeNodeAttr', [
        this.moving.id,
        'whiteboard',
        null
      ]);
    }
  },

  stopMoving: function () {
    if (this.moving.child) {
      this.stopMovingChild()
    } else if (this.moving.id) {
      this.stopMovingMain()
    }
    if (this.moving.currentTarget) {
      this.hideDropShadow()
    }
    this.moving = null
    document.removeEventListener('mousemove', this._boundMove)
    document.removeEventListener('mouseup', this._boundUp)
    this.vline.style.display = 'none'
    this.hline.style.display = 'none'
    this.rootNode.classList.remove('whiteboard--moving')
  },

  getNode: function () {
    return this.rootNode
  }
}


},{"../../lib/dnd.js":6,"./block":18}],21:[function(_dereq_,module,exports){

var Controller = _dereq_('../../lib/controller')
  , util = _dereq_('../../lib/util')

  , WFNode = _dereq_('./node')
  , WFView = _dereq_('./view')
  , WFVL = _dereq_('./vl')

module.exports = WFController

function WFController(model, options) {
  Controller.call(this, model, options)
  this.on('rebase', function (id) {
      this.trigger('bullet', this.model.getLineage(id))
  }.bind(this))
}

WFController.prototype = util.extend(Object.create(Controller.prototype), {
  refreshBullet: function () {
    this.trigger('bullet', this.model.getLineage(this.model.root))
  }
})

WFController.prototype.actions = util.extend({
  clickBullet: function (id) {
    if (id === 'new') return
    this.view.rebase(id)
    this.trigger('bullet', this.model.getLineage(id))
  },
  backALevel: function () {
    var root = this.view.root
      , pid = this.model.ids[root].parent
    if (!this.model.ids[pid]) return
    this.actions.clickBullet(pid)
  }
}, Controller.prototype.actions)


},{"../../lib/controller":4,"../../lib/util":16,"./node":24,"./view":25,"./vl":26}],22:[function(_dereq_,module,exports){

module.exports = {
  Controller: _dereq_('./controller'),
  Model: _dereq_('./model'),
  Node: _dereq_('./node'),
  View: _dereq_('./view'),
  ViewLayer: _dereq_('./vl'),
}


},{"./controller":21,"./model":23,"./node":24,"./view":25,"./vl":26}],23:[function(_dereq_,module,exports){

var Model = _dereq_('../../lib/model')

module.exports = WFModel

function WFModel() {
  Model.apply(this, arguments)
}

WFModel.prototype = Object.create(Model.prototype)

WFModel.prototype.getLineage = function (id) {
  var lineage = []
  while (this.ids[id]) {
    lineage.unshift({
      content: this.ids[id].content,
      id: id
    })
    id = this.ids[id].parent
  }
  return lineage
}

WFModel.prototype.search = function (text) {
  var items = []
    , frontier = [this.root]
  text = text.toLowerCase()
  while (frontier.length) {
      var next = []
      for (var i=0; i<frontier.length; i++) {
          var content = this.ids[frontier[i]].content
          if (content && content.toLowerCase().indexOf(text) !== -1) {
            items.push({id: frontier[i], text: this.ids[frontier[i]].content})
          }
          var children = this.ids[frontier[i]].children
          if (children) {
            next = next.concat(children)
          }
      }
      frontier = next
  }
  return items
}


},{"../../lib/model":13}],24:[function(_dereq_,module,exports){

var DefaultNode = _dereq_('../../lib/default-node')

module.exports = WFNode

function WFNode(content, meta, options, isNew) {
  DefaultNode.call(this, content, meta, options, isNew)
  this.done = meta.done
}

WFNode.prototype = Object.create(DefaultNode.prototype)
WFNode.prototype.constructor = WFNode

WFNode.prototype.setAttr = function (attr, value) {
  if (attr !== 'done') {
    DefaultNode.prototype.setAttr.call(this, attr, value)
    return
  }
  this.setDone(value)
}

WFNode.prototype.setDone = function (isDone) {
  this.done = isDone
  if (isDone) {
    this.node.classList.add('treed__default-node--done')
  } else {
    this.node.classList.remove('treed__default-node--done')
  }
}

WFNode.prototype.extra_actions = {
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.o.clickBullet()
    }
  },
  'back a level': {
    binding: 'shift+alt+return',
    action: function () {
      this.o.backALevel()
    }
  },
  'toggle done': {
    binding: 'ctrl+return',
    action: function () {
      this.blur()
      this.o.changed('done', !this.done)
      this.focus()
      if (this.done) {
        this.o.goDown()
      }
    }
  }
}


},{"../../lib/default-node":5}],25:[function(_dereq_,module,exports){

var View = _dereq_('../../lib/view')

module.exports = WFView

function WFView() {
  View.apply(this, arguments)
}

WFView.prototype = Object.create(View.prototype)

WFView.prototype.extra_actions = {
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.ctrl.actions.clickBullet(this.active)
    }
  },
  'back a level': {
    binding: 'shift+alt+return',
    action: function () {
      this.ctrl.actions.backALevel()
    }
  },
  'toggle done': {
    binding: 'ctrl+return',
    action: function () {
      if (this.active === null) return
      var id = this.active
        , done = !this.model.ids[id].meta.done
        , next = this.model.idBelow(id, this.root)
      if (next === undefined) next = id
      this.ctrl.actions.changed(this.active, 'done', done)
      if (done) {
        this.goTo(next)
      }
    }
  }
}


},{"../../lib/view":17}],26:[function(_dereq_,module,exports){

var DomViewLayer = _dereq_('../../lib/dom-vl')

module.exports = WFVL

function WFVL() {
  DomViewLayer.apply(this, arguments)
}

WFVL.prototype = Object.create(DomViewLayer.prototype)

WFVL.prototype.makeHead = function (body, actions) {
  var head = DomViewLayer.prototype.makeHead.call(this, body, actions)
    , bullet = document.createElement('div')
  bullet.classList.add('treed__bullet')
  bullet.addEventListener('mousedown', actions.clickBullet)
  head.insertBefore(bullet, head.childNodes[1])
  return head
}


},{"../../lib/dom-vl":7}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvYmFzZS1ub2RlLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9jb21tYW5kZWdlci5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvY29tbWFuZHMuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2NvbnRyb2xsZXIuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2RlZmF1bHQtbm9kZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvZG5kLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9kb20tdmwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2Ryb3Atc2hhZG93LmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIva2V5cy5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvbG9jYWwtcGwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL21lbS1wbC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvbW9kZWwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3NsaWRlLWRvd24uanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3NsaWRlLXVwLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi91dGlsLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi92aWV3LmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL3NraW5zL3doaXRlYm9hcmQvYmxvY2suanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd2hpdGVib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93aGl0ZWJvYXJkL3ZpZXcuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L2NvbnRyb2xsZXIuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L2luZGV4LmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL3NraW5zL3dvcmtmbG93eS9tb2RlbC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93b3JrZmxvd3kvbm9kZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93b3JrZmxvd3kvdmlldy5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93b3JrZmxvd3kvdmwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0dEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTm9kZVxuXG52YXIga2V5cyA9IHJlcXVpcmUoJy4va2V5cycpXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbmZ1bmN0aW9uIEJhc2VOb2RlKGNvbnRlbnQsIG1ldGEsIG9wdGlvbnMsIGlzTmV3KSB7XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnQgfHwgJydcbiAgdGhpcy5pc05ldyA9IGlzTmV3XG4gIHRoaXMubyA9IG9wdGlvbnNcbiAgdGhpcy5vLmtleWJpbmRpbmdzID0gdXRpbC5tZXJnZSh0aGlzLmRlZmF1bHRfa2V5cywgb3B0aW9ucy5rZXlzKVxuXG4gIHRoaXMuZWRpdGluZyA9IGZhbHNlXG4gIHRoaXMuc2V0dXBOb2RlKCk7XG59XG5cbkJhc2VOb2RlLmFkZEFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGJpbmRpbmcsIGZ1bmMpIHtcbiAgaWYgKCF0aGlzLmV4dHJhX2FjdGlvbnMpIHtcbiAgICB0aGlzLmV4dHJhX2FjdGlvbnMgPSB7fVxuICB9XG4gIHRoaXMuZXh0cmFfYWN0aW9uc1thY3Rpb25dID0ge1xuICAgIGJpbmRpbmc6IGJpbmRpbmcsXG4gICAgZnVuYzogZnVuY1xuICB9XG59XG5cbkJhc2VOb2RlLnByb3RvdHlwZSA9IHtcbiAgLy8gcHVibGljXG4gIHN0YXJ0RWRpdGluZzogZnVuY3Rpb24gKGZyb21TdGFydCkge1xuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgYWRkRWRpdFRleHQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIH0sXG5cbiAgc2V0TWV0YTogZnVuY3Rpb24gKG1ldGEpIHtcbiAgfSxcblxuICBzZXRBdHRyOiBmdW5jdGlvbiAoYXR0ciwgdmFsdWUpIHtcbiAgfSxcblxuICAvLyBwcm90ZXh0ZWRcbiAgaXNBdFN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgaXNBdEVuZDogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIGlzQXRCb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgfSxcblxuICBpc0F0VG9wOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgc2V0dXBOb2RlOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gIH0sXG5cbiAgZ2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgfSxcblxuICBnZXRTZWxlY3Rpb25Qb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIC8vIFNob3VsZCB0aGVyZSBiZSBhIGNhblN0b3BFZGl0aW5nP1xuICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhcnRFZGl0aW5nKCk7XG4gIH0sXG5cbiAgYmx1cjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RvcEVkaXRpbmcoKTtcbiAgfSxcblxuICBrZXlIYW5kbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjdGlvbnMgPSB7fVxuICAgICAgLCBhY3Rpb25cbiAgICBmb3IgKGFjdGlvbiBpbiB0aGlzLm8ua2V5YmluZGluZ3MpIHtcbiAgICAgIGFjdGlvbnNbdGhpcy5vLmtleWJpbmRpbmdzW2FjdGlvbl1dID0gdGhpcy5hY3Rpb25zW2FjdGlvbl1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5leHRyYV9hY3Rpb25zKSB7XG4gICAgICBmb3IgKGFjdGlvbiBpbiB0aGlzLmV4dHJhX2FjdGlvbnMpIHtcbiAgICAgICAgaWYgKCFhY3Rpb25zW2FjdGlvbl0pIHtcbiAgICAgICAgICBhY3Rpb25zW3RoaXMuZXh0cmFfYWN0aW9uc1thY3Rpb25dLmJpbmRpbmddID0gdGhpcy5leHRyYV9hY3Rpb25zW2FjdGlvbl0uYWN0aW9uXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cyhhY3Rpb25zKS5iaW5kKHRoaXMpXG4gIH0sXG5cbiAgZGVmYXVsdF9rZXlzOiB7XG4gICAgJ3VuZG8nOiAnY3RybCt6JyxcbiAgICAncmVkbyc6ICdjdHJsK3NoaWZ0K3onLFxuICAgICdjb2xsYXBzZSc6ICdhbHQrbGVmdCcsXG4gICAgJ3VuY29sbGFwc2UnOiAnYWx0K3JpZ2h0JyxcbiAgICAnZGVkZW50JzogJ3NoaWZ0K3RhYiwgc2hpZnQrYWx0K2xlZnQnLFxuICAgICdpbmRlbnQnOiAndGFiLCBzaGlmdCthbHQrcmlnaHQnLFxuICAgICdtb3ZlIHVwJzogJ3NoaWZ0K2FsdCt1cCcsXG4gICAgJ21vdmUgZG93bic6ICdzaGlmdCthbHQrZG93bicsXG4gICAgJ3VwJzogJ3VwJyxcbiAgICAnZG93bic6ICdkb3duJyxcbiAgICAnbGVmdCc6ICdsZWZ0JyxcbiAgICAncmlnaHQnOiAncmlnaHQnLFxuICAgICdhZGQgYWZ0ZXInOiAncmV0dXJuJyxcbiAgICAnaW5zZXJ0IHJldHVybic6ICdzaGlmdCtyZXR1cm4nLFxuICAgICdtZXJnZSB1cCc6ICdiYWNrc3BhY2UnLFxuICAgICdzdG9wIGVkaXRpbmcnOiAnZXNjYXBlJyxcbiAgfSxcblxuICBhY3Rpb25zOiB7XG4gICAgJ3VuZG8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udW5kbygpXG4gICAgfSxcblxuICAgICdyZWRvJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLnJlZG8oKVxuICAgIH0sXG5cbiAgICAnY29sbGFwc2UnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udG9nZ2xlQ29sbGFwc2UodHJ1ZSlcbiAgICB9LFxuXG4gICAgJ3VuY29sbGFwc2UnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udG9nZ2xlQ29sbGFwc2UoZmFsc2UpXG4gICAgfSxcblxuICAgICdkZWRlbnQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8ubW92ZUxlZnQoKVxuICAgIH0sXG5cbiAgICAnaW5kZW50JzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLm1vdmVSaWdodCgpXG4gICAgfSxcblxuICAgICdtb3ZlIHVwJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLm1vdmVVcCgpXG4gICAgfSxcblxuICAgICdtb3ZlIGRvd24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8ubW92ZURvd24oKVxuICAgIH0sXG5cbiAgICAndXAnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5pc0F0VG9wKCkpIHtcbiAgICAgICAgdGhpcy5vLmdvVXAoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSxcblxuICAgICdkb3duJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuaXNBdEJvdHRvbSgpKSB7XG4gICAgICAgIHRoaXMuby5nb0Rvd24oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgJ2xlZnQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5pc0F0U3RhcnQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vLmdvVXAoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgJ3JpZ2h0JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuaXNBdEVuZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm8uZ29Eb3duKHRydWUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnaW5zZXJ0IHJldHVybic6IGZ1bmN0aW9uIChlKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnYWRkIGFmdGVyJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNzID0gdGhpcy5nZXRTZWxlY3Rpb25Qb3NpdGlvbigpXG4gICAgICAgICwgY29udGVudCA9IHRoaXMuZ2V0VmlzaWJsZVZhbHVlKClcbiAgICAgICAgLCByZXN0ID0gbnVsbFxuICAgICAgaWYgKHRoaXMuaXNNdWx0aUxpbmUoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgdmFyIHJlc3QgPSB0aGlzLnNwbGl0UmlnaHRPZkN1cnNvcigpXG4gICAgICB0aGlzLnN0b3BFZGl0aW5nKClcbiAgICAgIHRoaXMuby5hZGRBZnRlcihyZXN0LCB0cnVlKVxuICAgIH0sXG5cbiAgICAvLyBvbiBiYWNrc3BhY2VcbiAgICAnbWVyZ2UgdXAnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdmFsdWUgPSB0aGlzLmdldElucHV0VmFsdWUoKVxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vLnJlbW92ZSgpXG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuaXNNdWx0aUxpbmUoKSAmJiB0aGlzLmlzQXRTdGFydCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm8ucmVtb3ZlKHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgJ3N0b3AgZWRpdGluZyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcEVkaXRpbmcoKTtcbiAgICB9XG4gIH0sXG59XG5cbiIsIlxudmFyIGNvbW1hbmRzID0gcmVxdWlyZSgnLi9jb21tYW5kcycpXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWFuZGVnZXJcblxuZnVuY3Rpb24gbWFrZUNvbW1hbmQodHlwZSwgYXJncykge1xuICB2YXIgbmFtZXMgPSBjb21tYW5kc1t0eXBlXS5hcmdzXG4gICAgLCBkYXRhID0ge31cbiAgZm9yICh2YXIgaT0wOyBpPG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZGF0YVtuYW1lc1tpXV0gPSBhcmdzW2ldXG4gIH1cbiAgcmV0dXJuIHt0eXBlOiB0eXBlLCBkYXRhOiBkYXRhfVxufVxuXG4vKipcbiAqIE1hbmFnZXMgdGhlIGV4ZWN1dGlvbiBvZiBjb21tYW5kcy5cbiAqL1xuZnVuY3Rpb24gQ29tbWFuZGVnZXIobW9kZWwpIHtcbiAgdGhpcy5jb21tYW5kcyA9IFtdXG4gIHRoaXMuaGlzdHBvcyA9IDBcbiAgdGhpcy52aWV3ID0gbnVsbFxuICB0aGlzLmxpc3RlbmVycyA9IHt9XG4gIHRoaXMud29ya2luZyA9IGZhbHNlXG4gIHRoaXMubW9kZWwgPSBtb2RlbFxufVxuXG5Db21tYW5kZWdlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBFeGVjdXRlIG9uZSBvciBtb3JlIGNvbW1lbnRzLlxuICAgKlxuICAgKiBVc2FnZTpcbiAgICpcbiAgICogLSBleGVjdXRlQ29tbWFuZHMoJ2NtZHR5cGUnLCBbYXJncywgZXRjXSlcbiAgICogLSBleGVjdXRlQ29tbWFuZHMoJ2NtZHR5cGUnLCBbYXJncywgZXRjXSwgJ25vdGhlcicsIFttb3JlLCBhcmdzXSlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgdGhlIGNvbW1hbmQgdG8gZXhlY3V0ZVxuICAgKiBAcGFyYW0ge2xpc3R9IGFyZ3MgYSBsaXN0IG9mIGFyZ3MgdG8gcGFzcyB0byB0aGUgY29tbWVudFxuICAgKi9cbiAgZXhlY3V0ZUNvbW1hbmRzOiBmdW5jdGlvbiAodHlwZSwgYXJncykge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHJldHVyblxuICAgIHZhciBjbWRzID0gW107XG4gICAgdmFyIGlcbiAgICBmb3IgKGk9MDsgaTxhcmd1bWVudHMubGVuZ3RoOyBpKz0yKSB7XG4gICAgICBjbWRzLnB1c2gobWFrZUNvbW1hbmQoYXJndW1lbnRzW2ldLCBhcmd1bWVudHNbaSsxXSkpXG4gICAgfVxuICAgIGlmICh0aGlzLmhpc3Rwb3MgPiAwKSB7XG4gICAgICB0aGlzLmNvbW1hbmRzID0gdGhpcy5jb21tYW5kcy5zbGljZSgwLCAtdGhpcy5oaXN0cG9zKVxuICAgICAgdGhpcy5oaXN0cG9zID0gMFxuICAgIH1cbiAgICB0aGlzLmNvbW1hbmRzLnB1c2goY21kcylcbiAgICBmb3IgKGk9MDsgaTxjbWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmRvQ29tbWFuZChjbWRzW2ldKVxuICAgIH1cbiAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZScpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYW4gZXZlbnQgb24gbGlzdGVuZXJzXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IHRoZSBldmVudCB0byB0cmlnZ2VyXG4gICAqL1xuICB0cmlnZ2VyOiBmdW5jdGlvbiAod2hhdCkge1xuICAgIHZhciByZXN0ID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgZm9yICh2YXIgaXRlbSBpbiB0aGlzLmxpc3RlbmVyc1t3aGF0XSkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbd2hhdF1baXRlbV0uYXBwbHkobnVsbCwgcmVzdClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgZm9yIGFuIGV2ZW50XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3aGF0IHRoZSBldmVudCB0eXBlXG4gICAqIEBwYXJhbSB7Zm59IGNiIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAqL1xuICBvbjogZnVuY3Rpb24gKHdoYXQsIGNiKSB7XG4gICAgaWYgKCF0aGlzLmxpc3RlbmVyc1t3aGF0XSkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbd2hhdF0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmxpc3RlbmVyc1t3aGF0XS5wdXNoKGNiKVxuICB9LFxuXG4gIC8qKlxuICAgKiBVbmRvIHRoZSBtb3N0IHJlY2VudCBjaGFuZ2UsIGlmIHBvc3NpYmxlLlxuICAgKlxuICAgKiBJZiBoaXN0b3J5IGlzIGVtcHR5LCBub3RoaW5nIGhhcHBlbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2x9IHdoZXRoZXIgYW55dGhpbmcgYWN0dWFsbHkgaGFwcGVuZWRcbiAgICovXG4gIHVuZG86IGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKVxuICAgIHZhciBwb3MgPSB0aGlzLmhpc3Rwb3MgPyB0aGlzLmhpc3Rwb3MgKyAxIDogMVxuICAgICAgLCBpeCA9IHRoaXMuY29tbWFuZHMubGVuZ3RoIC0gcG9zXG4gICAgaWYgKGl4IDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlIC8vIG5vIG1vcmUgdW5kbyFcbiAgICB9XG4gICAgdmFyIGNtZHMgPSB0aGlzLmNvbW1hbmRzW2l4XVxuICAgIGZvciAodmFyIGk9Y21kcy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICB0aGlzLnVuZG9Db21tYW5kKGNtZHNbaV0pXG4gICAgfVxuICAgIHRoaXMuaGlzdHBvcyArPSAxXG4gICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlZG8gdGhlIG1vc3QgcmVjZW50IHVuZG8sIGlmIGFueVxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sfSB3aGV0aGVyIGFub3RoaW5nIHdhcyByZWRvbmVcbiAgICovXG4gIHJlZG86IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcG9zID0gdGhpcy5oaXN0cG9zID8gdGhpcy5oaXN0cG9zIC0gMSA6IC0xXG4gICAgICAsIGl4ID0gdGhpcy5jb21tYW5kcy5sZW5ndGggLSAxIC0gcG9zXG4gICAgaWYgKGl4ID49IHRoaXMuY29tbWFuZHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2UgLy8gbm8gbW9yZSB0byByZWRvIVxuICAgIH1cbiAgICB2YXIgY21kcyA9IHRoaXMuY29tbWFuZHNbaXhdXG4gICAgZm9yICh2YXIgaT0wOyBpPGNtZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucmVkb0NvbW1hbmQoY21kc1tpXSlcbiAgICB9XG4gICAgdGhpcy5oaXN0cG9zIC09IDFcbiAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZScpXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICAvLyBwcml2YXRpc2ggdGhpbmdzXG4gIHNldFZpZXc6IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgdGhpcy52aWV3ID0gdmlld1xuICB9LFxuXG4gIGRvQ29tbWFuZDogZnVuY3Rpb24gKGNtZCkge1xuICAgIHRoaXMud29ya2luZyA9IHRydWVcbiAgICBjb21tYW5kc1tjbWQudHlwZV0uYXBwbHkuY2FsbChjbWQuZGF0YSwgdGhpcy52aWV3LCB0aGlzLm1vZGVsKVxuICAgIHRoaXMud29ya2luZyA9IGZhbHNlXG4gIH0sXG5cbiAgdW5kb0NvbW1hbmQ6IGZ1bmN0aW9uIChjbWQpIHtcbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlXG4gICAgY29tbWFuZHNbY21kLnR5cGVdLnVuZG8uY2FsbChjbWQuZGF0YSwgdGhpcy52aWV3LCB0aGlzLm1vZGVsKVxuICAgIHRoaXMud29ya2luZyA9IGZhbHNlXG4gIH0sXG5cbiAgcmVkb0NvbW1hbmQ6IGZ1bmN0aW9uIChjbWQpIHtcbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlXG4gICAgdmFyIGMgPSBjb21tYW5kc1tjbWQudHlwZV1cbiAgICA7KGMucmVkbyB8fCBjLmFwcGx5KS5jYWxsKGNtZC5kYXRhLCB0aGlzLnZpZXcsIHRoaXMubW9kZWwpXG4gICAgdGhpcy53b3JraW5nID0gZmFsc2VcbiAgfSxcbn1cblxuIiwiXG5mdW5jdGlvbiBjb3B5KG9uZSkge1xuICBpZiAoJ29iamVjdCcgIT09IHR5cGVvZiBvbmUpIHJldHVybiBvbmVcbiAgdmFyIHR3byA9IHt9XG4gIGZvciAodmFyIGF0dHIgaW4gb25lKSB7XG4gICAgdHdvW2F0dHJdID0gb25lW2F0dHJdXG4gIH1cbiAgcmV0dXJuIHR3b1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29sbGFwc2U6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ2RvQ29sbGFwc2UnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICBtb2RlbC5zZXRDb2xsYXBzZWQodGhpcy5pZCwgdGhpcy5kb0NvbGxhcHNlKVxuICAgICAgdmlldy5zZXRDb2xsYXBzZWQodGhpcy5pZCwgdGhpcy5kb0NvbGxhcHNlKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldENvbGxhcHNlZCh0aGlzLmlkLCAhdGhpcy5kb0NvbGxhcHNlKVxuICAgICAgdmlldy5zZXRDb2xsYXBzZWQodGhpcy5pZCwgIXRoaXMuZG9Db2xsYXBzZSlcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH0sXG4gIH0sXG4gIG5ld05vZGU6IHtcbiAgICBhcmdzOiBbJ3BpZCcsICdpbmRleCcsICd0ZXh0JywgJ21ldGEnLCAndHlwZSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBjciA9IG1vZGVsLmNyZWF0ZSh0aGlzLnBpZCwgdGhpcy5pbmRleCwgdGhpcy50ZXh0LCB0aGlzLnR5cGUsIHRoaXMubWV0YSlcbiAgICAgIHRoaXMuaWQgPSBjci5ub2RlLmlkXG4gICAgICB2aWV3LmFkZChjci5ub2RlLCBjci5iZWZvcmUpXG4gICAgICAvLyB2aWV3LnN0YXJ0RWRpdGluZyhjci5ub2RlLmlkKVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgZWQgPSB2aWV3LmVkaXRpbmdcbiAgICAgIHZpZXcucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB0aGlzLnNhdmVkID0gbW9kZWwucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB2YXIgbmlkID0gbW9kZWwuaWRzW3RoaXMucGlkXS5jaGlsZHJlblt0aGlzLmluZGV4LTFdXG4gICAgICBpZiAobmlkID09PSB1bmRlZmluZWQpIG5pZCA9IHRoaXMucGlkXG4gICAgICBpZiAoZWQpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcobmlkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlldy5zZXRBY3RpdmUobmlkKVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVkbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgYmVmb3JlID0gbW9kZWwucmVhZGQodGhpcy5zYXZlZClcbiAgICAgIHZpZXcuYWRkKHRoaXMuc2F2ZWQubm9kZSwgYmVmb3JlKVxuICAgIH1cbiAgfSxcbiAgYXBwZW5kVGV4dDoge1xuICAgIGFyZ3M6IFsnaWQnLCAndGV4dCddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHRoaXMub2xkdGV4dCA9IG1vZGVsLmlkc1t0aGlzLmlkXS5jb250ZW50XG4gICAgICBtb2RlbC5hcHBlbmRUZXh0KHRoaXMuaWQsIHRoaXMudGV4dClcbiAgICAgIHZpZXcuYXBwZW5kVGV4dCh0aGlzLmlkLCB0aGlzLnRleHQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldENvbnRlbnQodGhpcy5pZCwgdGhpcy5vbGR0ZXh0KVxuICAgICAgdmlldy5zZXRDb250ZW50KHRoaXMuaWQsIHRoaXMub2xkdGV4dClcbiAgICB9XG4gIH0sXG4gIGNoYW5nZUNvbnRlbnQ6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ2NvbnRlbnQnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9sZGNvbnRlbnQgPSBtb2RlbC5pZHNbdGhpcy5pZF0uY29udGVudFxuICAgICAgbW9kZWwuc2V0Q29udGVudCh0aGlzLmlkLCB0aGlzLmNvbnRlbnQpXG4gICAgICB2aWV3LnNldENvbnRlbnQodGhpcy5pZCwgdGhpcy5jb250ZW50KVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldENvbnRlbnQodGhpcy5pZCwgdGhpcy5vbGRjb250ZW50KVxuICAgICAgdmlldy5zZXRDb250ZW50KHRoaXMuaWQsIHRoaXMub2xkY29udGVudClcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH1cbiAgfSxcbiAgY2hhbmdlTm9kZUF0dHI6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ2F0dHInLCAndmFsdWUnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9sZHZhbHVlID0gY29weShtb2RlbC5pZHNbdGhpcy5pZF0ubWV0YVt0aGlzLmF0dHJdKVxuICAgICAgbW9kZWwuc2V0QXR0cih0aGlzLmlkLCB0aGlzLmF0dHIsIHRoaXMudmFsdWUpXG4gICAgICB2aWV3LnNldEF0dHIodGhpcy5pZCwgdGhpcy5hdHRyLCB0aGlzLnZhbHVlKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldEF0dHIodGhpcy5pZCwgdGhpcy5hdHRyLCB0aGlzLm9sZHZhbHVlKVxuICAgICAgdmlldy5zZXRBdHRyKHRoaXMuaWQsIHRoaXMuYXR0ciwgdGhpcy5vbGR2YWx1ZSlcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH1cbiAgfSxcbiAgY2hhbmdlTm9kZToge1xuICAgIGFyZ3M6IFsnaWQnLCAnbmV3bWV0YSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHRoaXMub2xkbWV0YSA9IGNvcHkobW9kZWwuaWRzW3RoaXMuaWRdLm1ldGEpXG4gICAgICBtb2RlbC5zZXRNZXRhKHRoaXMuaWQsIHRoaXMubmV3bWV0YSlcbiAgICAgIHZpZXcuc2V0TWV0YSh0aGlzLmlkLCB0aGlzLm5ld21ldGEpXG4gICAgICB2aWV3LmdvVG8odGhpcy5pZClcbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgbW9kZWwuc2V0TWV0YSh0aGlzLmlkLCB0aGlzLm9sZG1ldGEpXG4gICAgICB2aWV3LnNldE1ldGEodGhpcy5pZCwgdGhpcy5vbGRtZXRhKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfVxuICB9LFxuICByZW1vdmU6IHtcbiAgICBhcmdzOiBbJ2lkJ10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQodGhpcy5pZClcbiAgICAgIHZpZXcucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB0aGlzLnNhdmVkID0gbW9kZWwucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB2aWV3LnN0YXJ0RWRpdGluZyhjbG9zZXN0KVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgYmVmb3JlID0gbW9kZWwucmVhZGQodGhpcy5zYXZlZClcbiAgICAgIHZpZXcuYWRkVHJlZSh0aGlzLnNhdmVkLm5vZGUsIGJlZm9yZSlcbiAgICB9XG4gIH0sXG4gIGNvcHk6IHtcbiAgICBhcmdzOiBbJ2lkcyddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRoaXMuaWRzLm1hcChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsLmR1bXBEYXRhKGlkLCB0cnVlKVxuICAgICAgfSlcbiAgICAgIG1vZGVsLmNsaXBib2FyZCA9IGl0ZW1zXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICB9XG4gIH0sXG4gIGN1dDoge1xuICAgIGFyZ3M6IFsnaWRzJ10sXG4gICAgLy8gaWRzIGFyZSBhbHdheXMgaW4gZGVzY2VuZGluZyBvcmRlciwgd2hlcmUgMCBpcyB0aGUgZmlyc3Qgc2libGluZywgYW5kXG4gICAgLy8gdGhlIGxhc3QgaXRlbSBpcyB0aGUgbGFzdCBzaWJsaW5nXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pZHMubWFwKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2aWV3LnJlbW92ZShpZCwgdHJ1ZSlcbiAgICAgICAgcmV0dXJuIG1vZGVsLmR1bXBEYXRhKGlkLCB0cnVlKVxuICAgICAgfSlcbiAgICAgIG1vZGVsLmNsaXBib2FyZCA9IGl0ZW1zXG5cbiAgICAgIHZhciBpZCA9IHRoaXMuaWRzW3RoaXMuaWRzLmxlbmd0aC0xXVxuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQoaWQsIHRoaXMuaWRzKVxuICAgICAgdGhpcy5zYXZlZCA9IHRoaXMuaWRzLm1hcChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsLnJlbW92ZShpZClcbiAgICAgIH0pXG5cbiAgICAgIGlmICh2aWV3LmVkaXRpbmcpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcoY2xvc2VzdClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKGNsb3Nlc3QpXG4gICAgICB9XG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBiZWZvcmVcbiAgICAgIGZvciAodmFyIGk9dGhpcy5zYXZlZC5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICAgIGJlZm9yZSA9IG1vZGVsLnJlYWRkKHRoaXMuc2F2ZWRbaV0pXG4gICAgICAgIHZpZXcuYWRkVHJlZSh0aGlzLnNhdmVkW2ldLm5vZGUsIGJlZm9yZSlcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHZpZXcuc2V0U2VsZWN0aW9uKHRoaXMuaWRzKVxuICAgICAgICB2aWV3LnNldEFjdGl2ZSh0aGlzLmlkc1t0aGlzLmlkcy5sZW5ndGgtMV0pXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBpbXBvcnREYXRhOiB7XG4gICAgYXJnczogWydwaWQnLCAnaW5kZXgnLCAnZGF0YSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBwaWQgPSB0aGlzLnBpZFxuICAgICAgICAsIGluZGV4ID0gdGhpcy5pbmRleFxuICAgICAgICAsIGVkID0gdmlldy5lZGl0aW5nXG4gICAgICAgICwgaXRlbSA9IHRoaXMuZGF0YVxuICAgICAgdmFyIGNyID0gbW9kZWwuY3JlYXRlTm9kZXMocGlkLCBpbmRleCwgaXRlbSlcbiAgICAgIHZpZXcuYWRkVHJlZShjci5ub2RlLCBjci5iZWZvcmUpXG4gICAgICB2aWV3LnNldENvbGxhcHNlZChjci5ub2RlLnBhcmVudCwgZmFsc2UpXG4gICAgICBtb2RlbC5zZXRDb2xsYXBzZWQoY3Iubm9kZS5wYXJlbnQsIGZhbHNlKVxuICAgICAgdGhpcy5uZXdpZCA9IGNyLm5vZGUuaWRcbiAgICAgIGlmIChlZCkge1xuICAgICAgICB2aWV3LnN0YXJ0RWRpdGluZyh0aGlzLm5ld2lkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlldy5zZXRBY3RpdmUodGhpcy5uZXdpZClcbiAgICAgIH1cbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGlkID0gdGhpcy5uZXdpZFxuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQoaWQpXG4gICAgICB2aWV3LnJlbW92ZShpZClcbiAgICAgIHRoaXMuc2F2ZWQgPSBtb2RlbC5yZW1vdmUoaWQpXG4gICAgICBpZiAodmlldy5lZGl0aW5nKSB7XG4gICAgICAgIHZpZXcuc3RhcnRFZGl0aW5nKGNsb3Nlc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldEFjdGl2ZShjbG9zZXN0KVxuICAgICAgfVxuICAgICAgLy8gdmlldy5yZW1vdmUodGhpcy5uZXdpZClcbiAgICAgIC8vIHRoaXMuc2F2ZWQgPSBtb2RlbC5yZW1vdmUodGhpcy5uZXdpZClcbiAgICAgIG1vZGVsLmNsaXBib2FyZCA9IHRoaXMuc2F2ZWRcbiAgICB9LFxuICAgIHJlZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgLy8gdmFyIGJlZm9yZSA9IG1vZGVsLnJlYWRkKHRoaXMuc2F2ZWQpXG4gICAgICAvLyB2aWV3LmFkZFRyZWUodGhpcy5zYXZlZC5ub2RlLCBiZWZvcmUpXG4gICAgICB2YXIgYmVmb3JlID0gbW9kZWwucmVhZGQodGhpcy5zYXZlZClcbiAgICAgIHZpZXcuYWRkVHJlZSh0aGlzLnNhdmVkLm5vZGUsIGJlZm9yZSlcbiAgICAgIGlmICh2aWV3LmVkaXRpbmcpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcodGhpcy5uZXdpZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMubmV3aWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBwYXN0ZToge1xuICAgIGFyZ3M6IFsncGlkJywgJ2luZGV4J10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIHBpZCA9IHRoaXMucGlkXG4gICAgICAgICwgaW5kZXggPSB0aGlzLmluZGV4XG4gICAgICAgICwgZWQgPSB2aWV3LmVkaXRpbmdcbiAgICAgIHZhciBpZHMgPSBtb2RlbC5jbGlwYm9hcmQubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhciBjciA9IG1vZGVsLmNyZWF0ZU5vZGVzKHBpZCwgaW5kZXgsIGl0ZW0pXG4gICAgICAgIHZpZXcuYWRkVHJlZShjci5ub2RlLCBjci5iZWZvcmUpXG4gICAgICAgIHZpZXcuc2V0Q29sbGFwc2VkKGNyLm5vZGUucGFyZW50LCBmYWxzZSlcbiAgICAgICAgbW9kZWwuc2V0Q29sbGFwc2VkKGNyLm5vZGUucGFyZW50LCBmYWxzZSlcbiAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICByZXR1cm4gY3Iubm9kZS5pZFxuICAgICAgfSlcbiAgICAgIHRoaXMubmV3aWRzID0gaWRzXG4gICAgICBpZiAoaWRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgIGlmIChlZCkge1xuICAgICAgICAgIHZpZXcuc3RhcnRFZGl0aW5nKHRoaXMubmV3aWRzWzBdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMubmV3aWRzWzBdKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldFNlbGVjdGlvbihpZHMpXG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKGlkc1tpZHMubGVuZ3RoLTFdKVxuICAgICAgfVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgaWQgPSB0aGlzLm5ld2lkc1t0aGlzLm5ld2lkcy5sZW5ndGgtMV1cbiAgICAgIHZhciBjbG9zZXN0ID0gbW9kZWwuY2xvc2VzdE5vbkNoaWxkKGlkKVxuICAgICAgdGhpcy5zYXZlZCA9IHRoaXMubmV3aWRzLm1hcChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmlldy5yZW1vdmUoaWQpXG4gICAgICAgIHJldHVybiBtb2RlbC5yZW1vdmUoaWQpXG4gICAgICB9KVxuICAgICAgaWYgKHZpZXcuZWRpdGluZykge1xuICAgICAgICB2aWV3LnN0YXJ0RWRpdGluZyhjbG9zZXN0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlldy5zZXRBY3RpdmUoY2xvc2VzdClcbiAgICAgIH1cbiAgICAgIC8vIHZpZXcucmVtb3ZlKHRoaXMubmV3aWQpXG4gICAgICAvLyB0aGlzLnNhdmVkID0gbW9kZWwucmVtb3ZlKHRoaXMubmV3aWQpXG4gICAgICBtb2RlbC5jbGlwYm9hcmQgPSB0aGlzLnNhdmVkXG4gICAgfSxcbiAgICByZWRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIC8vIHZhciBiZWZvcmUgPSBtb2RlbC5yZWFkZCh0aGlzLnNhdmVkKVxuICAgICAgLy8gdmlldy5hZGRUcmVlKHRoaXMuc2F2ZWQubm9kZSwgYmVmb3JlKVxuICAgICAgdGhpcy5zYXZlZC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGJlZm9yZSA9IG1vZGVsLnJlYWRkKGl0ZW0pXG4gICAgICAgIHZpZXcuYWRkVHJlZShpdGVtLm5vZGUsIGJlZm9yZSlcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuICBtb3ZlOiB7XG4gICAgYXJnczogWydpZCcsICdwaWQnLCAnaW5kZXgnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9waWQgPSBtb2RlbC5pZHNbdGhpcy5pZF0ucGFyZW50XG4gICAgICB0aGlzLm9pbmRleCA9IG1vZGVsLmlkc1t0aGlzLm9waWRdLmNoaWxkcmVuLmluZGV4T2YodGhpcy5pZClcbiAgICAgIHZhciBiZWZvcmUgPSBtb2RlbC5tb3ZlKHRoaXMuaWQsIHRoaXMucGlkLCB0aGlzLmluZGV4KVxuICAgICAgdmFyIHBhcmVudCA9IG1vZGVsLmlkc1t0aGlzLm9waWRdXG4gICAgICAgICwgbGFzdGNoaWxkID0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMFxuICAgICAgdmlldy5tb3ZlKHRoaXMuaWQsIHRoaXMucGlkLCBiZWZvcmUsIHRoaXMub3BpZCwgbGFzdGNoaWxkKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBiZWZvcmUgPSBtb2RlbC5tb3ZlKHRoaXMuaWQsIHRoaXMub3BpZCwgdGhpcy5vaW5kZXgpXG4gICAgICAgICwgbGFzdGNoaWxkID0gbW9kZWwuaWRzW3RoaXMucGlkXS5jaGlsZHJlbi5sZW5ndGggPT09IDBcbiAgICAgIHZpZXcubW92ZSh0aGlzLmlkLCB0aGlzLm9waWQsIGJlZm9yZSwgdGhpcy5waWQsIGxhc3RjaGlsZClcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH1cbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlclxuXG52YXIgQ29tbWFuZGVnZXIgPSByZXF1aXJlKCcuL2NvbW1hbmRlZ2VyJylcblxuICAsIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxuXG5mdW5jdGlvbiBDb250cm9sbGVyKG1vZGVsLCBvKSB7XG4gIG8gPSBvIHx8IHt2aWV3T3B0aW9uczoge319XG4gIHRoaXMubyA9IHV0aWwuZXh0ZW5kKHt9LCBvKVxuICB0aGlzLm1vZGVsID0gbW9kZWxcbiAgdGhpcy5jbWQgPSBuZXcgQ29tbWFuZGVnZXIodGhpcy5tb2RlbClcblxuICB2YXIgYWN0aW9ucyA9IHt9XG4gIGZvciAodmFyIGFjdGlvbiBpbiB0aGlzLmFjdGlvbnMpIHtcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiB0aGlzLmFjdGlvbnNbYWN0aW9uXSkgYWN0aW9uc1thY3Rpb25dID0gdGhpcy5hY3Rpb25zW2FjdGlvbl1cbiAgICBlbHNlIGFjdGlvbnNbYWN0aW9uXSA9IHRoaXMuYWN0aW9uc1thY3Rpb25dLmJpbmQodGhpcylcbiAgfVxuICB0aGlzLmFjdGlvbnMgPSBhY3Rpb25zXG4gIHRoaXMubGlzdGVuZXJzID0ge31cbn1cblxuQ29udHJvbGxlci5wcm90b3R5cGUgPSB7XG4gIC8qKlxuICAgKiBTZXQgdGhlIGN1cnJlbnQgdmlld1xuICAgKlxuICAgKiBAcGFyYW0ge2NsYXNzfSBWaWV3IHRoZSBWaWV3IGNsYXNzXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHRoZSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIHZpZXdcbiAgICogQHJldHVybiB7Vmlld30gdGhlIHZpZXcgb2JqZWN0XG4gICAqL1xuICBzZXRWaWV3OiBmdW5jdGlvbiAoVmlldywgb3B0aW9ucykge1xuICAgIHZhciBvdmlldyA9IHRoaXMudmlld1xuICAgIHRoaXMudmlldyA9IG5ldyBWaWV3KFxuICAgICAgdGhpcy5iaW5kQWN0aW9ucy5iaW5kKHRoaXMpLFxuICAgICAgdGhpcy5tb2RlbCwgdGhpcyxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICB2YXIgcm9vdCA9IChvdmlldyA/IG92aWV3LnJvb3QgOiB0aGlzLm1vZGVsLnJvb3QpO1xuICAgIHZhciBub2RlID0gdGhpcy52aWV3LmluaXRpYWxpemUocm9vdClcbiAgICBpZiAob3ZpZXcpIHtcbiAgICAgIG92aWV3LmdldE5vZGUoKS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChub2RlLCBvdmlldy5nZXROb2RlKCkpO1xuICAgIH1cbiAgICB0aGlzLmNtZC5zZXRWaWV3KHRoaXMudmlldylcbiAgICByZXR1cm4gdGhpcy52aWV3XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVuZG8gdGhlIG1vc3QgcmVjZW50IGNvbW1lbnRcbiAgICovXG4gIHVuZG86IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNtZC51bmRvKClcbiAgfSxcblxuICAvKipcbiAgICogUmVkbyB0aGUgbW9zdCByZWNlbnQgdW5kb1xuICAgKi9cbiAgcmVkbzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY21kLnJlZG8oKVxuICB9LFxuXG4gIC8qKlxuICAgKiBBdHRhY2ggYSBsaXN0ZW5lclxuICAgKi9cbiAgb246IGZ1bmN0aW9uIChldnQsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMubGlzdGVuZXJzW2V2dF0pIHtcbiAgICAgIHRoaXMubGlzdGVuZXJzW2V2dF0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmxpc3RlbmVyc1tldnRdLnB1c2goZnVuYylcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXJcbiAgICovXG4gIG9mZjogZnVuY3Rpb24gKGV2dCwgZnVuYykge1xuICAgIGlmICghdGhpcy5saXN0ZW5lcnNbZXZ0XSkgcmV0dXJuIGZhbHNlXG4gICAgdmFyIGkgPSB0aGlzLmxpc3RlbmVyc1tldnRdLmluZGV4T2YoZnVuYylcbiAgICBpZiAoaSA9PT0gLTEpIHJldHVybiBmYWxzZVxuICAgIHRoaXMubGlzdGVuZXJzW2V2dF0uc3BsaWNlKGksIDEpXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICAvKipcbiAgICogVHJpZ2dlciBhbiBldmVudFxuICAgKi9cbiAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICghdGhpcy5saXN0ZW5lcnNbZXZ0XSkgcmV0dXJuXG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5saXN0ZW5lcnNbZXZ0XS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbZXZ0XVtpXS5hcHBseShudWxsLCBhcmdzKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGJvdW5kIHZlcnNpb25zIG9mIGVhY2ggYWN0aW9uIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGlkXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGlzIGlkIHRzIHNpbnMgdGhpbmdzXG4gICAqL1xuICBiaW5kQWN0aW9uczogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIGFjdGlvbnMgPSB7fVxuICAgICAgLCB2YWxcbiAgICBmb3IgKHZhciBhY3Rpb24gaW4gdGhpcy5hY3Rpb25zKSB7XG4gICAgICB2YWwgPSB0aGlzLmFjdGlvbnNbYWN0aW9uXVxuICAgICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgdmFsKSB7XG4gICAgICAgIHZhbCA9IHRoaXNbdmFsXVthY3Rpb25dLmJpbmQodGhpc1t2YWxdLCBpZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbCA9IHZhbC5iaW5kKHRoaXMsIGlkKVxuICAgICAgfVxuICAgICAgYWN0aW9uc1thY3Rpb25dID0gdmFsXG4gICAgfVxuICAgIHJldHVybiBhY3Rpb25zXG4gIH0sXG5cbiAgaW1wb3J0RGF0YTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy52aWV3LmdldEFjdGl2ZSgpO1xuICAgIGlmIChwYXJlbnQgPT09IFwibmV3XCIpIHtcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZU5ldygpXG4gICAgICAgIHBhcmVudCA9IHRoaXMudmlldy5yb290XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdpbXBvcnREYXRhJywgW3BhcmVudCwgMCwgZGF0YV0pXG4gICAgLy8gdGhpcy5tb2RlbC5jcmVhdGVOb2Rlcyh0aGlzLnZpZXcuZ2V0QWN0aXZlKCksIDAsIGRhdGEpXG4gICAgLy8gdGhpcy52aWV3LnJlYmFzZSh0aGlzLnZpZXcucm9vdClcbiAgfSxcblxuICBleHBvcnREYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kZWwuZHVtcERhdGEodGhpcy5tb2RlbC5yb290LCB0cnVlKVxuICB9LFxuXG4gIGV4ZWN1dGVDb21tYW5kczogZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xuICAgICAgdGhpcy5jbWQuZXhlY3V0ZUNvbW1hbmRzLmFwcGx5KHRoaXMuY21kLCBhcmd1bWVudHNbMF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY21kLmV4ZWN1dGVDb21tYW5kcy5hcHBseSh0aGlzLmNtZCwgYXJndW1lbnRzKVxuICAgIH1cbiAgfSxcblxuICAvLyBwdWJsaWNcbiAgc2V0Q29sbGFwc2VkOiBmdW5jdGlvbiAoaWQsIGRvQ29sbGFwc2UpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwuaGFzQ2hpbGRyZW4oaWQpKSByZXR1cm5cbiAgICBpZiAodGhpcy5tb2RlbC5pc0NvbGxhcHNlZChpZCkgPT09IGRvQ29sbGFwc2UpIHJldHVyblxuICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdjb2xsYXBzZScsIFtpZCwgZG9Db2xsYXBzZV0pO1xuICB9LFxuXG4gIGFkZEJlZm9yZTogZnVuY3Rpb24gKGlkLCB0ZXh0KSB7XG4gICAgdmFyIG53ID0gdGhpcy5tb2RlbC5pZE5ldyhpZCwgdHJ1ZSlcbiAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4LCB0ZXh0XSlcbiAgfSxcblxuICBhY3Rpb25zOiB7XG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy50cmlnZ2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgZ29VcDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVybiB0aGlzLnZpZXcuZ29Ubyh0aGlzLnZpZXcucm9vdClcbiAgICAgIC8vIHNob3VsZCBJIGNoZWNrIHRvIHNlZSBpZiBpdCdzIG9rP1xuICAgICAgdmFyIGFib3ZlID0gdGhpcy5tb2RlbC5pZEFib3ZlKGlkKVxuICAgICAgaWYgKGFib3ZlID09PSB1bmRlZmluZWQpIHJldHVyblxuICAgICAgdGhpcy52aWV3LnN0YXJ0RWRpdGluZyhhYm92ZSk7XG4gICAgfSxcblxuICAgIGdvRG93bjogZnVuY3Rpb24gKGlkLCBmcm9tU3RhcnQpIHtcbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVybiB0aGlzLnZpZXcuZ29Ubyh0aGlzLnZpZXcucm9vdClcbiAgICAgIHZhciBiZWxvdyA9IHRoaXMubW9kZWwuaWRCZWxvdyhpZCwgdGhpcy52aWV3LnJvb3QpXG4gICAgICBpZiAoYmVsb3cgPT09IHVuZGVmaW5lZCkgcmV0dXJuXG4gICAgICB0aGlzLnZpZXcuc3RhcnRFZGl0aW5nKGJlbG93LCBmcm9tU3RhcnQpO1xuICAgIH0sXG5cbiAgICBnb0xlZnQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuIHRoaXMudmlldy5nb1RvKHRoaXMudmlldy5yb290KVxuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICB2YXIgcGFyZW50ID0gdGhpcy5tb2RlbC5nZXRQYXJlbnQoaWQpXG4gICAgICBpZiAoIXBhcmVudCkgcmV0dXJuXG4gICAgICB0aGlzLnZpZXcuc3RhcnRFZGl0aW5nKHBhcmVudClcbiAgICB9LFxuXG4gICAgZ29SaWdodDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm4gdGhpcy52aWV3LmdvVG8odGhpcy52aWV3LnJvb3QpXG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLm1vZGVsLmdldENoaWxkKGlkKVxuICAgICAgaWYgKCFjaGlsZCkgcmV0dXJuXG4gICAgICB0aGlzLnZpZXcuc3RhcnRFZGl0aW5nKGNoaWxkKVxuICAgIH0sXG5cbiAgICBzdGFydE1vdmluZzogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgdGhpcy52aWV3LnN0YXJ0TW92aW5nKGlkKVxuICAgIH0sXG5cbiAgICAvLyBtb2RpZmljYXRpb25cbiAgICB1bmRvOiBmdW5jdGlvbiAoKSB7dGhpcy5jbWQudW5kbygpfSxcbiAgICByZWRvOiBmdW5jdGlvbiAoKSB7dGhpcy5jbWQucmVkbygpfSxcblxuICAgIC8vIGNvbW1hbmRlcnNcbiAgICBjdXQ6IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgIGlmIChpZHMgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShpZHMpKSB7XG4gICAgICAgIGlkcyA9IFtpZHNdXG4gICAgICB9XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnY3V0JywgW2lkc10pXG4gICAgfSxcblxuICAgIGNvcHk6IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShpZHMpKSB7XG4gICAgICAgIGlkcyA9IFtpZHNdXG4gICAgICB9XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnY29weScsIFtpZHNdKVxuICAgIH0sXG5cbiAgICBwYXN0ZTogZnVuY3Rpb24gKGlkLCBhYm92ZSkge1xuICAgICAgaWYgKCF0aGlzLm1vZGVsLmNsaXBib2FyZCkgcmV0dXJuXG4gICAgICB2YXIgbncgPSB0aGlzLm1vZGVsLmlkTmV3KGlkLCBhYm92ZSlcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdwYXN0ZScsIFtudy5waWQsIG53LmluZGV4XSlcbiAgICB9LFxuXG4gICAgY2hhbmdlQ29udGVudDogZnVuY3Rpb24gKGlkLCBjb250ZW50KSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSB7XG4gICAgICAgIGlmICghY29udGVudCkgcmV0dXJuXG4gICAgICAgIHZhciBudyA9IHRoaXMudmlldy5yZW1vdmVOZXcoKVxuICAgICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4LCBjb250ZW50LCB7fV0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NoYW5nZUNvbnRlbnQnLCBbaWQsIGNvbnRlbnRdKVxuICAgIH0sXG5cbiAgICBjaGFuZ2VkOiBmdW5jdGlvbiAoaWQsIGF0dHIsIHZhbHVlKSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSB7XG4gICAgICAgIGlmICghdmFsdWUpIHJldHVyblxuICAgICAgICB2YXIgbncgPSB0aGlzLnZpZXcucmVtb3ZlTmV3KClcbiAgICAgICAgdmFyIG1ldGEgPSB7fVxuICAgICAgICBtZXRhW2F0dHJdID0gdmFsdWVcbiAgICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ25ld05vZGUnLCBbbncucGlkLCBudy5pbmRleCwgJycsIG1ldGFdKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdjaGFuZ2VOb2RlQXR0cicsIFtpZCwgYXR0ciwgdmFsdWVdKVxuICAgIH0sXG5cbiAgICBtb3ZlOiBmdW5jdGlvbiAod2hlcmUsIGlkLCB0YXJnZXQpIHtcbiAgICAgIHZhciBhY3Rpb24gPSB7XG4gICAgICAgIGJlZm9yZTogJ1RvQmVmb3JlJyxcbiAgICAgICAgYWZ0ZXI6ICdUb0FmdGVyJyxcbiAgICAgICAgY2hpbGQ6ICdJbnRvJ1xuICAgICAgfVt3aGVyZV1cbiAgICAgIHRoaXMuYWN0aW9uc1snbW92ZScgKyBhY3Rpb25dKGlkLCB0YXJnZXQpLy90YXJnZXQsIGlkKVxuICAgIH0sXG5cbiAgICBtb3ZlVG9CZWZvcmU6IGZ1bmN0aW9uIChpZCwgc2lkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgdmFyIHBsYWNlID0gdGhpcy5tb2RlbC5tb3ZlQmVmb3JlUGxhY2Uoc2lkLCBpZClcbiAgICAgIGlmICghcGxhY2UpIHJldHVyblxuICAgICAgLy8gaWYgKHRoaXMubW9kZWwuc2FtZVBsYWNlKGlkLCBwbGFjZSkpIHJldHVyblxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBsYWNlLnBpZCwgcGxhY2UuaXhdKVxuICAgIH0sXG5cbiAgICBtb3ZlVG9BZnRlcjogZnVuY3Rpb24gKGlkLCBzaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB2YXIgcGxhY2UgPSB0aGlzLm1vZGVsLm1vdmVBZnRlclBsYWNlKHNpZCwgaWQpXG4gICAgICBpZiAoIXBsYWNlKSByZXR1cm5cbiAgICAgIC8vIGlmICh0aGlzLm1vZGVsLnNhbWVQbGFjZShpZCwgcGxhY2UpKSByZXR1cm5cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwbGFjZS5waWQsIHBsYWNlLml4XSlcbiAgICB9LFxuXG4gICAgbW92ZUludG86IGZ1bmN0aW9uIChpZCwgcGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgaWYgKHRoaXMubW9kZWwuc2FtZVBsYWNlKGlkLCB7cGlkOiBwaWQsIGl4OiAwfSkpIHJldHVyblxuICAgICAgaWYgKCF0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKHBpZCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwaWQsIDBdKVxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NvbGxhcHNlJywgW3BpZCwgZmFsc2VdLCAnbW92ZScsIFtpZCwgcGlkLCAwXSlcbiAgICB9LFxuXG4gICAgbW92ZVJpZ2h0OiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB2YXIgc2liID0gdGhpcy5tb2RlbC5wcmV2U2libGluZyhpZCwgdHJ1ZSlcbiAgICAgIGlmICh1bmRlZmluZWQgPT09IHNpYikgcmV0dXJuXG4gICAgICBpZiAoIXRoaXMubW9kZWwuaXNDb2xsYXBzZWQoc2liKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHNpYiwgZmFsc2VdKVxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NvbGxhcHNlJywgW3NpYiwgZmFsc2VdLCAnbW92ZScsIFtpZCwgc2liLCBmYWxzZV0pXG4gICAgfSxcblxuICAgIG1vdmVMZWZ0OiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICBpZiAodGhpcy5tb2RlbC5pZHNbaWRdLnBhcmVudCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgLy8gVE9ETyBoYW5kbGUgbXVsdGlwbGUgc2VsZWN0ZWRcbiAgICAgIHZhciBwbGFjZSA9IHRoaXMubW9kZWwuc2hpZnRMZWZ0UGxhY2UoaWQpXG4gICAgICBpZiAoIXBsYWNlKSByZXR1cm5cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwbGFjZS5waWQsIHBsYWNlLml4XSlcbiAgICB9LFxuXG4gICAgbW92ZVVwOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICAvLyBUT0RPIGhhbmRsZSBtdWx0aXBsZSBzZWxlY3RlZFxuICAgICAgdmFyIHBsYWNlID0gdGhpcy5tb2RlbC5zaGlmdFVwUGxhY2UoaWQpXG4gICAgICBpZiAoIXBsYWNlKSByZXR1cm5cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwbGFjZS5waWQsIHBsYWNlLml4XSlcbiAgICB9LFxuXG4gICAgbW92ZURvd246IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIC8vIFRPRE8gaGFuZGxlIG11bHRpcGxlIHNlbGVjdGVkXG4gICAgICB2YXIgcGxhY2UgPSB0aGlzLm1vZGVsLnNoaWZ0RG93blBsYWNlKGlkKVxuICAgICAgaWYgKCFwbGFjZSkgcmV0dXJuXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbW92ZScsIFtpZCwgcGxhY2UucGlkLCBwbGFjZS5peF0pXG4gICAgfSxcblxuICAgIG1vdmVUb1RvcDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgdmFyIGZpcnN0ID0gdGhpcy5tb2RlbC5maXJzdFNpYmxpbmcoaWQpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBmaXJzdCkgcmV0dXJuXG4gICAgICB2YXIgcGlkID0gdGhpcy5tb2RlbC5pZHNbZmlyc3RdLnBhcmVudFxuICAgICAgaWYgKHBpZCA9PT0gdW5kZWZpbmVkKSByZXR1cm5cbiAgICAgIHZhciBpeCA9IHRoaXMubW9kZWwuaWRzW3BpZF0uY2hpbGRyZW4uaW5kZXhPZihmaXJzdClcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwaWQsIGl4XSlcbiAgICB9LFxuXG4gICAgbW92ZVRvQm90dG9tOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB2YXIgbGFzdCA9IHRoaXMubW9kZWwubGFzdFNpYmxpbmcoaWQpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBsYXN0KSByZXR1cm5cbiAgICAgIHZhciBwaWQgPSB0aGlzLm1vZGVsLmlkc1tsYXN0XS5wYXJlbnRcbiAgICAgIGlmIChwaWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuXG4gICAgICB2YXIgaXggPSB0aGlzLm1vZGVsLmlkc1twaWRdLmNoaWxkcmVuLmluZGV4T2YobGFzdClcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwaWQsIGl4ICsgMV0pXG4gICAgfSxcblxuICAgIHRvZ2dsZUNvbGxhcHNlOiBmdW5jdGlvbiAoaWQsIHllcykge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHllcyA9ICF0aGlzLm1vZGVsLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoIHx8ICF0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKVxuICAgICAgfVxuICAgICAgaWYgKHllcykge1xuICAgICAgICBpZCA9IHRoaXMubW9kZWwuZmluZENvbGxhcHNlcihpZClcbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsLmhhc0NoaWxkcmVuKGlkKSB8fCB0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKSkgcmV0dXJuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMubW9kZWwuaGFzQ2hpbGRyZW4oaWQpIHx8ICF0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKSkgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnY29sbGFwc2UnLCBbaWQsIHllc10pXG4gICAgfSxcblxuICAgIGFkZEJlZm9yZTogZnVuY3Rpb24gKGlkLCB0ZXh0LCBmb2N1cykge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSB7XG4gICAgICAgIC8vIFRPRE86IGJldHRlciBiZWhhdmlvciBoZXJlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdmFyIG53ID0gdGhpcy5tb2RlbC5pZE5ldyhpZCwgdHJ1ZSlcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCduZXdOb2RlJywgW253LnBpZCwgbncuaW5kZXgsIHRleHRdKVxuICAgICAgaWYgKGZvY3VzKSB0aGlzLnZpZXcuc3RhcnRFZGl0aW5nKClcbiAgICB9LFxuXG4gICAgYWRkQWZ0ZXI6IGZ1bmN0aW9uIChpZCwgdGV4dCwgZm9jdXMpIHtcbiAgICAgIHZhciBud1xuICAgICAgdmFyIGVkID0gZm9jdXMgfHwgdGhpcy52aWV3Lm1vZGUgPT09ICdpbnNlcnQnXG4gICAgICAvLyB0aGlzLnZpZXcuc3RvcEVkaXRpbmcoKVxuICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xuICAgICAgICAvLyBUT0RPOiBiZXR0ZXIgYmVoYXZpb3IgaGVyZVxuXG4gICAgICAgIG53ID0gdGhpcy52aWV3LnJlbW92ZU5ldygpXG4gICAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKFxuICAgICAgICAgICduZXdOb2RlJywgW253LnBpZCwgbncuaW5kZXgrMSwgJyddXG4gICAgICAgIClcbiAgICAgICAgaWYgKGVkKSB0aGlzLnZpZXcuc3RhcnRFZGl0aW5nKClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXcubmV3Tm9kZSkgcmV0dXJuIHRoaXMudmlldy5zdGFydEVkaXRpbmcoJ25ldycpXG4gICAgICAgIHRoaXMudmlldy5hZGROZXcoaWQsIDApXG4gICAgICAgIHRoaXMudmlldy5zdGFydEVkaXRpbmcoJ25ldycpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgbncgPSB0aGlzLm1vZGVsLmlkTmV3KGlkLCBmYWxzZSwgdGhpcy52aWV3LnJvb3QpXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4LCB0ZXh0XSlcbiAgICAgIGlmIChlZCkgdGhpcy52aWV3LnN0YXJ0RWRpdGluZygpXG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKGlkLCBhZGRUZXh0KSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgdmFyIGJlZm9yZSA9IHRoaXMubW9kZWwuaWRBYm92ZShpZClcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKFxuICAgICAgICAncmVtb3ZlJywgW2lkXSxcbiAgICAgICAgJ2FwcGVuZFRleHQnLCBbYmVmb3JlLCBhZGRUZXh0IHx8ICcnXVxuICAgICAgKVxuICAgIH0sXG5cbiAgICBzZXRFZGl0aW5nOiAndmlldycsXG4gICAgZG9uZUVkaXRpbmc6ICd2aWV3J1xuICB9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0Tm9kZVxuXG52YXIgQmFzZU5vZGUgPSByZXF1aXJlKCcuL2Jhc2Utbm9kZScpXG5cbmlmICh3aW5kb3cubWFya2VkKSB7XG4gIHZhciByZW5kZXJlciA9IG5ldyBtYXJrZWQuUmVuZGVyZXIoKVxuICByZW5kZXJlci5saW5rID0gZnVuY3Rpb24gKGhyZWYsIHRpdGxlLCB0ZXh0KSB7XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJyArIGhyZWYgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgdGl0bGU9XCInICsgdGl0bGUgKyAnXCI+JyArIHRleHQgKyAnPC9hPic7XG4gIH1cbiAgbWFya2VkLnNldE9wdGlvbnMoe1xuICAgIGdmbTogdHJ1ZSxcbiAgICBzYW5pdGl6ZTogdHJ1ZSxcbiAgICB0YWJsZXM6IHRydWUsXG4gICAgYnJlYWtzOiB0cnVlLFxuICAgIHBlZGFudGljOiBmYWxzZSxcbiAgICBzYW5pdGl6ZTogZmFsc2UsXG4gICAgc21hcnRMaXN0czogdHJ1ZSxcbiAgICBzbWFydHlwYW50czogdHJ1ZSxcbiAgICByZW5kZXJlcjogcmVuZGVyZXJcbiAgfSlcbn1cblxuZnVuY3Rpb24gRGVmYXVsdE5vZGUoY29udGVudCwgbWV0YSwgb3B0aW9ucywgaXNOZXcpIHtcbiAgQmFzZU5vZGUuY2FsbCh0aGlzLCBjb250ZW50LCBtZXRhLCBvcHRpb25zLCBpc05ldylcbn1cblxuRGVmYXVsdE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlTm9kZS5wcm90b3R5cGUpXG5EZWZhdWx0Tm9kZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZWZhdWx0Tm9kZVxuXG5mdW5jdGlvbiB0bWVyZ2UoYSwgYikge1xuICBmb3IgKHZhciBjIGluIGIpIHtcbiAgICBhW2NdID0gYltjXVxuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUh0bWwoc3RyKSB7XG4gIGlmICghc3RyKSByZXR1cm4gJyc7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0cikpO1xuICByZXR1cm4gZGl2LmlubmVySFRNTDtcbn07XG5cbmZ1bmN0aW9uIHVuRXNjYXBlSHRtbChzdHIpIHtcbiAgaWYgKCFzdHIpIHJldHVybiAnJztcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC88ZGl2Pi9nLCAnXFxuJykucmVwbGFjZSgvPGJyPi9nLCAnXFxuJylcbiAgICAucmVwbGFjZSgvPFxcL2Rpdj4vZywgJycpXG4gICAgLnJlcGxhY2UoL1xcdTIwMGIvZywgJycpXG59XG5cbnRtZXJnZShEZWZhdWx0Tm9kZS5wcm90b3R5cGUsIHtcbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5pbnB1dC5pbm5lckhUTUwgPSB2YWx1ZVxuICB9LFxuXG4gIGdldElucHV0VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdW5Fc2NhcGVIdG1sKHRoaXMuaW5wdXQuaW5uZXJIVE1MKVxuICB9LFxuXG4gIGdldFZpc2libGVWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlucHV0LmZpcnN0Q2hpbGQudGV4dENvbnRlbnRcbiAgfSxcblxuICBpc011bHRpTGluZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlucHV0LmlubmVySFRNTC5tYXRjaCgvKDxkaXY+fDxicnxcXG4pL2cpXG4gIH0sXG5cbiAgc3BsaXRSaWdodE9mQ3Vyc29yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRleHQgPSB0aGlzLmlucHV0LmZpcnN0Q2hpbGQudGV4dENvbnRlbnRcbiAgICAgICwgcyA9IHRoaXMuZ2V0U2VsZWN0aW9uUG9zaXRpb24oKVxuICAgICAgLCBsZWZ0ID0gZXNjYXBlSHRtbCh0ZXh0LnNsaWNlKDAsIHMpKVxuICAgICAgLCByaWdodCA9IGVzY2FwZUh0bWwodGV4dC5zbGljZShzKSlcbiAgICBpZiAoIXJpZ2h0KSByZXR1cm5cbiAgICB0aGlzLnNldElucHV0VmFsdWUobGVmdClcbiAgICB0aGlzLnNldFRleHRDb250ZW50KGxlZnQpXG4gICAgaWYgKCF0aGlzLmlzTmV3KSB0aGlzLm8uY2hhbmdlQ29udGVudChsZWZ0KVxuICAgIHJldHVybiByaWdodFxuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gdmFsdWUgPyBtYXJrZWQodmFsdWUgKyAnJykgOiAnJ1xuICB9LFxuXG4gIHNldHVwTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cbiAgICB0aGlzLmlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmlucHV0LnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgdHJ1ZSlcbiAgICB0aGlzLmlucHV0LmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19pbnB1dCcpXG5cbiAgICB0aGlzLnRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMudGV4dC5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fdGV4dCcpXG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19kZWZhdWx0LW5vZGUnKVxuXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudCh0aGlzLmNvbnRlbnQpXG4gICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHRoaXMudGV4dClcbiAgICB0aGlzLnJlZ2lzdGVyTGlzdGVuZXJzKCk7XG4gIH0sXG5cbiAgaXNBdFRvcDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBiYiA9IHRoaXMuaW5wdXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICwgc2VsciA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5nZXRSYW5nZUF0KDApLmdldENsaWVudFJlY3RzKClbMF1cbiAgICByZXR1cm4gc2Vsci50b3AgPCBiYi50b3AgKyA1XG4gIH0sXG5cbiAgaXNBdEJvdHRvbTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBiYiA9IHRoaXMuaW5wdXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICwgc2VsciA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5nZXRSYW5nZUF0KDApLmdldENsaWVudFJlY3RzKClbMF1cbiAgICByZXR1cm4gc2Vsci5ib3R0b20gPiBiYi5ib3R0b20gLSA1XG4gIH0sXG5cbiAgZ2V0U2VsZWN0aW9uUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpXG4gICAgICAsIHJhbiA9IHNlbC5nZXRSYW5nZUF0KDApXG4gICAgcmV0dXJuIHJhbi5zdGFydE9mZnNldFxuICB9LFxuXG4gIHN0YXJ0RWRpdGluZzogZnVuY3Rpb24gKGZyb21TdGFydCkge1xuICAgIGlmICh0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIHRoaXMuZWRpdGluZyA9IHRydWU7XG4gICAgdGhpcy5zZXRJbnB1dFZhbHVlKHRoaXMuY29udGVudClcbiAgICB0aGlzLm5vZGUucmVwbGFjZUNoaWxkKHRoaXMuaW5wdXQsIHRoaXMudGV4dClcbiAgICB0aGlzLmlucHV0LmZvY3VzKCk7XG4gICAgdGhpcy5zZXRTZWxlY3Rpb24oIWZyb21TdGFydClcbiAgICB0aGlzLm8uc2V0RWRpdGluZygpXG4gIH0sXG5cbiAgc3RvcEVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuZWRpdGluZykgcmV0dXJuXG4gICAgY29uc29sZS5sb2coJ3N0b3AgZWRkaW50JywgdGhpcy5pc05ldylcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmdldElucHV0VmFsdWUoKVxuICAgIHRoaXMuZWRpdGluZyA9IGZhbHNlXG4gICAgdGhpcy5ub2RlLnJlcGxhY2VDaGlsZCh0aGlzLnRleHQsIHRoaXMuaW5wdXQpXG4gICAgdGhpcy5vLmRvbmVFZGl0aW5nKCk7XG4gICAgaWYgKHRoaXMuY29udGVudCAhPSB2YWx1ZSB8fCB0aGlzLmlzTmV3KSB7XG4gICAgICB0aGlzLnNldFRleHRDb250ZW50KHZhbHVlKVxuICAgICAgdGhpcy5jb250ZW50ID0gdmFsdWVcbiAgICAgIHRoaXMuby5jaGFuZ2VDb250ZW50KHRoaXMuY29udGVudClcbiAgICB9XG4gIH0sXG5cbiAgaXNBdFN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0U2VsZWN0aW9uUG9zaXRpb24oKSA9PT0gMFxuICB9LFxuXG4gIGlzQXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLndhcm4oXCJUSElTIElTIFdST05HXCIpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgYWRkRWRpdFRleHQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIHBsID0gdGhpcy5jb250ZW50Lmxlbmd0aFxuICAgIHRoaXMuY29udGVudCArPSB0ZXh0XG4gICAgdGhpcy5zZXRJbnB1dFZhbHVlKHRoaXMuY29udGVudClcbiAgICB0aGlzLnNldFRleHRDb250ZW50KHRoaXMuY29udGVudClcbiAgICBpZiAoIXRoaXMuZWRpdGluZykge1xuICAgICAgdGhpcy5lZGl0aW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMubm9kZS5yZXBsYWNlQ2hpbGQodGhpcy5pbnB1dCwgdGhpcy50ZXh0KVxuICAgICAgdGhpcy5vLnNldEVkaXRpbmcoKTtcbiAgICB9XG4gICAgdGhpcy5zZXRTZWxlY3Rpb24ocGwpXG4gIH0sXG5cbiAgc2V0Q29udGVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gICAgdGhpcy5zZXRJbnB1dFZhbHVlKGNvbnRlbnQpXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChjb250ZW50KVxuICB9LFxuXG4gIHJlZ2lzdGVyTGlzdGVuZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy50ZXh0LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZS50YXJnZXQubm9kZU5hbWUgPT0gJ0EnKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5zdGFydEVkaXRpbmcoKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHRoaXMuc3RvcEVkaXRpbmcoKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHZhciBrZXlIYW5kbGVyID0gdGhpcy5rZXlIYW5kbGVyKClcblxuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICByZXR1cm4ga2V5SGFuZGxlcihlKVxuICAgIH0pXG5cbiAgfSxcblxuICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uIChlbmQpIHtcbiAgICB2YXIgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpXG4gICAgc2VsLnNlbGVjdEFsbENoaWxkcmVuKHRoaXMuaW5wdXQpXG4gICAgdHJ5IHtcbiAgICAgIHNlbFsnY29sbGFwc2VUbycgKyAoZW5kID8gJ0VuZCcgOiAnU3RhcnQnKV0oKVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH0sXG5cbn0pXG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBEdW5nZW9uc0FuZERyYWdvbnNcblxuZnVuY3Rpb24gZmluZFRhcmdldCh0YXJnZXRzLCBlKSB7XG4gIGZvciAodmFyIGk9MDsgaTx0YXJnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRhcmdldHNbaV0udG9wID4gZS5jbGllbnRZKSB7XG4gICAgICByZXR1cm4gdGFyZ2V0c1tpID4gMCA/IGktMSA6IDBdXG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXRzW3RhcmdldHMubGVuZ3RoLTFdXG59XG5cbi8vIE1hbmFnZXMgRHJhZ2dpbmcgTiBEcm9wcGluZ1xuZnVuY3Rpb24gRHVuZ2VvbnNBbmREcmFnb25zKHZsLCBhY3Rpb24sIGZpbmRGdW5jdGlvbikge1xuICB0aGlzLnZsID0gdmxcbiAgdGhpcy5hY3Rpb24gPSBhY3Rpb25cbiAgdGhpcy5maW5kRnVuY3Rpb24gPSBmaW5kRnVuY3Rpb24gfHwgZmluZFRhcmdldFxufVxuXG5EdW5nZW9uc0FuZERyYWdvbnMucHJvdG90eXBlID0ge1xuICBzdGFydE1vdmluZzogZnVuY3Rpb24gKHRhcmdldHMsIGlkKSB7XG4gICAgdGhpcy5tb3ZpbmcgPSB7XG4gICAgICB0YXJnZXRzOiB0YXJnZXRzLFxuICAgICAgc2hhZG93OiB0aGlzLnZsLm1ha2VEcm9wU2hhZG93KCksXG4gICAgICBjdXJyZW50OiBudWxsXG4gICAgfVxuICAgIHRoaXMudmwuc2V0TW92aW5nKGlkLCB0cnVlKVxuXG4gICAgdmFyIG9uTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB0aGlzLmRyYWcoaWQsIGUpXG4gICAgfS5iaW5kKHRoaXMpXG5cbiAgICB2YXIgb25VcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICcnXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdmUpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25VcClcbiAgICAgIHRoaXMuZHJvcChpZCwgZSlcbiAgICB9LmJpbmQodGhpcylcblxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gJ21vdmUnXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3ZlKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvblVwKVxuICB9LFxuXG4gIGRyYWc6IGZ1bmN0aW9uIChpZCwgZSkge1xuICAgIGlmICh0aGlzLm1vdmluZy5jdXJyZW50KSB7XG4gICAgICB0aGlzLnZsLnNldERyb3BwaW5nKHRoaXMubW92aW5nLmN1cnJlbnQuaWQsIGZhbHNlLCB0aGlzLm1vdmluZy5jdXJyZW50LnBsYWNlID09PSAnY2hpbGQnKVxuICAgIH1cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5maW5kRnVuY3Rpb24odGhpcy5tb3ZpbmcudGFyZ2V0cywgZSlcbiAgICB0aGlzLm1vdmluZy5zaGFkb3cubW92ZVRvKHRhcmdldClcbiAgICB0aGlzLm1vdmluZy5jdXJyZW50ID0gdGFyZ2V0XG4gICAgdGhpcy52bC5zZXREcm9wcGluZyh0YXJnZXQuaWQsIHRydWUsIHRoaXMubW92aW5nLmN1cnJlbnQucGxhY2UgPT09ICdjaGlsZCcpXG4gIH0sXG5cbiAgZHJvcDogZnVuY3Rpb24gKGlkLCBlKSB7XG4gICAgdGhpcy5tb3Zpbmcuc2hhZG93LnJlbW92ZSgpXG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLm1vdmluZy5jdXJyZW50XG4gICAgdGhpcy52bC5zZXRNb3ZpbmcoaWQsIGZhbHNlKVxuICAgIGlmICghdGhpcy5tb3ZpbmcuY3VycmVudCkgcmV0dXJuXG4gICAgdGhpcy52bC5zZXREcm9wcGluZyhjdXJyZW50LmlkLCBmYWxzZSwgY3VycmVudC5wbGFjZSA9PT0gJ2NoaWxkJylcbiAgICBpZiAoY3VycmVudC5pZCA9PT0gaWQpIHJldHVyblxuICAgIHRoaXMuYWN0aW9uKGN1cnJlbnQucGxhY2UsIGlkLCBjdXJyZW50LmlkKVxuICAgIHRoaXMubW92aW5nID0gZmFsc2VcbiAgfSxcbn1cblxuIiwiXG52YXIgRHJvcFNoYWRvdyA9IHJlcXVpcmUoJy4vZHJvcC1zaGFkb3cnKVxuICAsIHNsaWRlRG93biA9IHJlcXVpcmUoJy4vc2xpZGUtZG93bicpXG4gICwgc2xpZGVVcCA9IHJlcXVpcmUoJy4vc2xpZGUtdXAnKVxuICAsIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvbVZpZXdMYXllclxuXG4vKipcbiAqIG86IG9wdGlvbnMgLT4geyBOb2RlOiB0aGUgY2xhc3MgfVxuICovXG5mdW5jdGlvbiBEb21WaWV3TGF5ZXIobykge1xuICB0aGlzLmRvbSA9IHt9XG4gIHRoaXMucm9vdCA9IG51bGxcbiAgdGhpcy5vID0gdXRpbC5tZXJnZSh7XG4gICAgYW5pbWF0ZTogdHJ1ZVxuICB9LCBvKVxufVxuXG5Eb21WaWV3TGF5ZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogRm9yZ2V0IGFib3V0IGFsbCBub2RlcyAtIHRoZXkgd2lsbCBiZSBkaXNwb3NlZCBvZlxuICAgKi9cbiAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmRvbSA9IHt9XG4gIH0sXG5cbiAgLyoqXG4gICAqIHJvb3Q6IHRoZSBvbGQgcm9vdCB0aGF0IGlzIHRvIGJlIHJlcGxhY2VkXG4gICAqL1xuICByZWJhc2U6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgaWYgKHJvb3QucGFyZW50Tm9kZSkge1xuICAgICAgcm9vdC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh0aGlzLnJvb3QsIHJvb3QpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBnZW5lcmF0ZSB0aGUgZHJvcCB0YXJnZXQgZGVmaW5pdGlvbnMgZm9yIGFsbCBvZiB0aGUgdmlzaWJsZVxuICAgKiBub2RlcyB1bmRlciBhIGdpdmVuIHJvb3QuXG4gICAqXG4gICAqIHJvb3Q6IHRoZSBpZCBvZiB0aGUgbm9kZSB0byBzdGFydCBmcm9tXG4gICAqIG1vZGVsOiB0aGUgbW9kZWwgLSB0byBmaW5kIGNoaWxkcmVuXG4gICAqIG1vdmluZzogdGhlIGlkIG9mIHRoZSBub2RlIHRoYXQncyBtb3ZpbmcgLSBzbyB0aGF0IHlvdSB3b24ndCBkcm9wIGEgbm9kZVxuICAgKiAgICAgICAgIGluc2lkZSBpdHNlbGZcbiAgICogdG9wOiBvbmx5IHRydWUgdGhlIGZpcnN0IGNhbGwsIGRldGVybWluZXMgaWYgaXQncyB0aGUgcm9vdCBub2RlIChlLmcuIG5vXG4gICAqICAgICAgZHJvcCB0YXJnZXQgYWJvdmUpXG4gICAqL1xuICBkcm9wVGFyZ2V0czogZnVuY3Rpb24gKHJvb3QsIG1vZGVsLCBtb3ZpbmcsIHRvcCkge1xuICAgIHZhciB0YXJnZXRzID0gW11cbiAgICAgICwgYmMgPSB0aGlzLmRvbVtyb290XS5oZWFkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIHRhcmdldFxuICAgICAgLCBjaGlsZFRhcmdldFxuXG4gICAgaWYgKCF0b3ApIHtcbiAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgaWQ6IHJvb3QsXG4gICAgICAgIHRvcDogYmMudG9wLFxuICAgICAgICBsZWZ0OiBiYy5sZWZ0LFxuICAgICAgICB3aWR0aDogYmMud2lkdGgsXG4gICAgICAgIGhlaWdodDogYmMuaGVpZ2h0LFxuICAgICAgICBwbGFjZTogJ2JlZm9yZScsXG4gICAgICAgIHNob3c6IHtcbiAgICAgICAgICBsZWZ0OiBiYy5sZWZ0LC8vICsgMjAsXG4gICAgICAgICAgd2lkdGg6IGJjLndpZHRoLC8vIC0gMjAsXG4gICAgICAgICAgeTogYmMudG9wXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRhcmdldHMucHVzaCh0YXJnZXQpXG4gICAgfVxuICAgIGlmIChyb290ID09PSBtb3ZpbmcpIHJldHVybiB0YXJnZXRzXG5cbiAgICBpZiAobW9kZWwuaXNDb2xsYXBzZWQocm9vdCkgJiYgIXRvcCkgcmV0dXJuIHRhcmdldHNcbiAgICB2YXIgY2ggPSBtb2RlbC5pZHNbcm9vdF0uY2hpbGRyZW5cbiAgICBmb3IgKHZhciBpPTA7IGk8Y2gubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRhcmdldHMgPSB0YXJnZXRzLmNvbmNhdCh0aGlzLmRyb3BUYXJnZXRzKGNoW2ldLCBtb2RlbCwgbW92aW5nKSlcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldHNcbiAgfSxcblxuICBtYWtlRHJvcFNoYWRvdzogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgRHJvcFNoYWRvdygpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIG5vZGVcbiAgICpcbiAgICogaWQ6IHRoZSBub2RlIHRvIHJlbW92ZVxuICAgKiBwaWQ6IHRoZSBwYXJlbnQgaWRcbiAgICogbGFzdGNoaWxkOiB3aGV0aGVyIHRoZSBub2RlIHdhcyB0aGUgbGFzdCBjaGlsZFxuICAgKi9cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoaWQsIHBpZCwgbGFzdGNoaWxkKSB7XG4gICAgdmFyIG4gPSB0aGlzLmRvbVtpZF1cbiAgICBpZiAoIW4ubWFpbi5wYXJlbnROb2RlKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgbi5tYWluLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobi5tYWluKVxuICAgIH0gY2F0Y2ggKGUpIHtyZXR1cm59XG4gICAgZGVsZXRlIHRoaXMuZG9tW2lkXVxuICAgIGlmIChsYXN0Y2hpbGQpIHtcbiAgICAgIHRoaXMuZG9tW3BpZF0ubWFpbi5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faXRlbS0tcGFyZW50JylcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBub2RlIC0gdGhpcyBpcyBwdWJsaWMgZmFjaW5nXG4gICAqXG4gICAqIG5vZGU6IG9iamVjdCBsb29rcyBsaWtlIHtpZDosIGNvbnRlbnQ6LCBtZXRhOiwgcGFyZW50On1cbiAgICogYm91bmRzOiBhbiBvYmplY3Qgb2YgYWN0aW9uIGZ1bmN0aW9uc1xuICAgKiBiZWZvcmU6IHRoZSBpZCBiZWZvcmUgd2hpY2ggdG8gYWRkXG4gICAqIGNoaWxkcmVuOiB3aGV0aGVyIHRoZSBuZXcgbm9kZSBoYXMgY2hpbGRyZW5cbiAgICovXG4gIGFkZE5ldzogZnVuY3Rpb24gKG5vZGUsIGJvdW5kcywgYmVmb3JlLCBjaGlsZHJlbikge1xuICAgIHZhciBkb20gPSB0aGlzLm1ha2VOb2RlKG5vZGUuaWQsIG5vZGUuY29udGVudCwgbm9kZS5tZXRhLCBub2RlLmRlcHRoIC0gdGhpcy5yb290RGVwdGgsIGJvdW5kcylcbiAgICB0aGlzLmFkZChub2RlLnBhcmVudCwgYmVmb3JlLCBkb20sIGNoaWxkcmVuKVxuICAgIGlmIChub2RlLmNvbGxhcHNlZCAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRDb2xsYXBzZWQobm9kZS5pZCwgdHJ1ZSlcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBhZGRpbmcgdGhpbmdzXG4gICAqL1xuICBhZGQ6IGZ1bmN0aW9uIChwYXJlbnQsIGJlZm9yZSwgZG9tLCBjaGlsZHJlbikge1xuICAgIHZhciBwID0gdGhpcy5kb21bcGFyZW50XVxuICAgIGlmIChiZWZvcmUgPT09IGZhbHNlKSB7XG4gICAgICBwLnVsLmFwcGVuZENoaWxkKGRvbSlcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJlZiA9IHRoaXMuZG9tW2JlZm9yZV1cbiAgICAgIHAudWwuaW5zZXJ0QmVmb3JlKGRvbSwgYmVmLm1haW4pXG4gICAgfVxuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgZG9tLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19pdGVtLS1wYXJlbnQnKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgYm9keVxuICAgKi9cbiAgYm9keTogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKCF0aGlzLmRvbVtpZF0pIHJldHVyblxuICAgIHJldHVybiB0aGlzLmRvbVtpZF0uYm9keVxuICB9LFxuXG4gIC8qKlxuICAgKiBNb3ZlIGEgbm9kZSBmcm9tIG9uZSBwbGFjZSB0byBhbm90aGVyXG4gICAqXG4gICAqIGlkOiAgICAgICAgdGhlIGlkIG9mIHRoZSBub2RlIHRoYXQncyBtb3ZpbmdcbiAgICogcGlkOiAgICAgICB0aGUgcGFyZW50IGlkIHRvIG1vdmUgaXQgdG9cbiAgICogYmVmb3JlOiAgICB0aGUgbm9kZSBpZCBiZWZvcmUgd2hpY2ggdG8gbW92ZSBpdC4gYGZhbHNlYCB0byBhcHBlbmRcbiAgICogcHBpZDogICAgICB0aGUgcHJldmlvdXMgcGFyZW50IGlkXG4gICAqIGxhc3RjaGlsZDogd2hldGhlciB0aGlzIHdhcyB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgcHJldmlvdXMgcGFyZW50XG4gICAqICAgICAgICAgICAgKGxlYXZpbmcgdGhhdCBwYXJlbnQgY2hpbGRsZXNzKVxuICAgKi9cbiAgbW92ZTogZnVuY3Rpb24gKGlkLCBwaWQsIGJlZm9yZSwgcHBpZCwgbGFzdGNoaWxkKSB7XG4gICAgdmFyIGQgPSB0aGlzLmRvbVtpZF1cbiAgICBkLm1haW4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkLm1haW4pXG4gICAgaWYgKGxhc3RjaGlsZCkge1xuICAgICAgdGhpcy5kb21bcHBpZF0ubWFpbi5jbGFzc0xpc3QucmVtb3ZlKCd0cmVlZF9faXRlbS0tcGFyZW50JylcbiAgICB9XG4gICAgaWYgKGJlZm9yZSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuZG9tW3BpZF0udWwuYXBwZW5kQ2hpbGQoZC5tYWluKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvbVtwaWRdLnVsLmluc2VydEJlZm9yZShkLm1haW4sIHRoaXMuZG9tW2JlZm9yZV0ubWFpbilcbiAgICB9XG4gICAgdGhpcy5kb21bcGlkXS5tYWluLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19pdGVtLS1wYXJlbnQnKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHNlbGVjdGlvbiBmcm9tIGEgc2V0IG9mIG5vZGVzXG4gICAqXG4gICAqIHNlbGVjdGlvbjogW2lkLCAuLi5dIG5vZGVzIHRvIGRlc2VsZWN0XG4gICAqL1xuICBjbGVhclNlbGVjdGlvbjogZnVuY3Rpb24gKHNlbGVjdGlvbikge1xuICAgIGZvciAodmFyIGk9MDsgaTxzZWxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghdGhpcy5kb21bc2VsZWN0aW9uW2ldXSkgY29udGludWU7XG4gICAgICB0aGlzLmRvbVtzZWxlY3Rpb25baV1dLm1haW4uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogU2hvdyB0aGUgc2VsZWN0aW9uIG9uIGEgc2V0IG9mIG5vZGVzXG4gICAqXG4gICAqIHNlbGVjdGlvbjogW2lkLCAuLi5dIG5vZGVzIHRvIHNlbGVjdFxuICAgKi9cbiAgc2hvd1NlbGVjdGlvbjogZnVuY3Rpb24gKHNlbGVjdGlvbikge1xuICAgIGlmICghc2VsZWN0aW9uLmxlbmd0aCkgcmV0dXJuXG4gICAgLy8gdXRpbC5lbnN1cmVJblZpZXcodGhpcy5kb21bc2VsZWN0aW9uWzBdXS5ib2R5Lm5vZGUpXG4gICAgZm9yICh2YXIgaT0wOyBpPHNlbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5kb21bc2VsZWN0aW9uW2ldXS5tYWluLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJylcbiAgICB9XG4gIH0sXG5cbiAgY2xlYXJBY3RpdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICghdGhpcy5kb21baWRdKSByZXR1cm5cbiAgICB0aGlzLmRvbVtpZF0ubWFpbi5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuICB9LFxuXG4gIHNob3dBY3RpdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICghdGhpcy5kb21baWRdKSByZXR1cm4gY29uc29sZS53YXJuKCdUcnlpbmcgdG8gYWN0aXZhdGUgYSBub2RlIHRoYXQgaXMgbm90IHJlbmRlcmVkJylcbiAgICB1dGlsLmVuc3VyZUluVmlldyh0aGlzLmRvbVtpZF0uYm9keS5ub2RlKVxuICAgIHRoaXMuZG9tW2lkXS5tYWluLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpXG4gIH0sXG5cbiAgc2V0Q29sbGFwc2VkOiBmdW5jdGlvbiAoaWQsIGlzQ29sbGFwc2VkKSB7XG4gICAgdGhpcy5kb21baWRdLm1haW4uY2xhc3NMaXN0W2lzQ29sbGFwc2VkID8gJ2FkZCcgOiAncmVtb3ZlJ10oJ2NvbGxhcHNlZCcpXG4gIH0sXG5cbiAgYW5pbWF0ZU9wZW46IGZ1bmN0aW9uIChpZCkge1xuICAgIHRoaXMuc2V0Q29sbGFwc2VkKGlkLCBmYWxzZSlcbiAgICBzbGlkZURvd24odGhpcy5kb21baWRdLnVsKVxuICB9LFxuXG4gIGFuaW1hdGVDbG9zZWQ6IGZ1bmN0aW9uIChpZCwgZG9uZSkge1xuICAgIHNsaWRlVXAodGhpcy5kb21baWRdLnVsLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldENvbGxhcHNlZChpZCwgdHJ1ZSlcbiAgICB9LmJpbmQodGhpcykpXG4gIH0sXG5cbiAgc2V0TW92aW5nOiBmdW5jdGlvbiAoaWQsIGlzTW92aW5nKSB7XG4gICAgdGhpcy5yb290LmNsYXNzTGlzdFtpc01vdmluZyA/ICdhZGQnIDogJ3JlbW92ZSddKCdtb3ZpbmcnKVxuICAgIHRoaXMuZG9tW2lkXS5tYWluLmNsYXNzTGlzdFtpc01vdmluZyA/ICdhZGQnIDogJ3JlbW92ZSddKCdtb3ZpbmcnKVxuICB9LFxuXG4gIHNldERyb3BwaW5nOiBmdW5jdGlvbiAoaWQsIGlzRHJvcHBpbmcsIGlzQ2hpbGQpIHtcbiAgICB2YXIgY2xzID0gJ2Ryb3BwaW5nJyArIChpc0NoaWxkID8gJy1jaGlsZCcgOiAnJylcbiAgICB0aGlzLmRvbVtpZF0ubWFpbi5jbGFzc0xpc3RbaXNEcm9wcGluZyA/ICdhZGQnIDogJ3JlbW92ZSddKGNscylcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSByb290IG5vZGVcbiAgICovXG4gIG1ha2VSb290OiBmdW5jdGlvbiAobm9kZSwgYm91bmRzKSB7XG4gICAgdmFyIGRvbSA9IHRoaXMubWFrZU5vZGUobm9kZS5pZCwgbm9kZS5jb250ZW50LCBub2RlLm1ldGEsIDAsIGJvdW5kcylcbiAgICAgICwgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgcm9vdC5jbGFzc0xpc3QuYWRkKCd0cmVlZCcpXG4gICAgcm9vdC5hcHBlbmRDaGlsZChkb20pXG4gICAgaWYgKG5vZGUuY29sbGFwc2VkICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnNldENvbGxhcHNlZChub2RlLmlkLCB0cnVlKVxuICAgIH1cbiAgICB0aGlzLnJvb3QgPSByb290XG4gICAgdGhpcy5yb290RGVwdGggPSBub2RlLmRlcHRoXG4gICAgcmV0dXJuIHJvb3RcbiAgfSxcblxuICAvKipcbiAgICogTWFrZSB0aGUgaGVhZCBmb3IgYSBnaXZlbiBub2RlXG4gICAqL1xuICBtYWtlSGVhZDogZnVuY3Rpb24gKGJvZHksIGFjdGlvbnMpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAsIGNvbGxhcHNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAsIG1vdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcblxuICAgIGNvbGxhcHNlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUuYnV0dG9uICE9PSAwKSByZXR1cm5cbiAgICAgIGFjdGlvbnMudG9nZ2xlQ29sbGFwc2UoKVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfSlcbiAgICBjb2xsYXBzZXIuY2xhc3NMaXN0LmFkZCgndHJlZWRfX2NvbGxhcHNlcicpXG5cbiAgICBtb3Zlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUuYnV0dG9uICE9PSAwKSByZXR1cm5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgYWN0aW9ucy5zdGFydE1vdmluZygpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9KVxuICAgIG1vdmVyLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19tb3ZlcicpXG5cbiAgICBoZWFkLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19oZWFkJylcbiAgICBoZWFkLmFwcGVuZENoaWxkKGNvbGxhcHNlcilcbiAgICBoZWFkLmFwcGVuZENoaWxkKGJvZHkubm9kZSk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChtb3ZlcilcbiAgICByZXR1cm4gaGVhZFxuICB9LFxuXG4gIC8qKlxuICAgKiBNYWtlIGEgbm9kZVxuICAgKi9cbiAgbWFrZU5vZGU6IGZ1bmN0aW9uIChpZCwgY29udGVudCwgbWV0YSwgbGV2ZWwsIGJvdW5kcykge1xuICAgIHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICAsIGJvZHkgPSB0aGlzLmJvZHlGb3IoaWQsIGNvbnRlbnQsIG1ldGEsIGJvdW5kcylcblxuICAgIGRvbS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faXRlbScpXG4gICAgLy8gZG9tLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19pdGVtLS1sZXZlbC0nICsgbGV2ZWwpXG5cbiAgICB2YXIgaGVhZCA9IHRoaXMubWFrZUhlYWQoYm9keSwgYm91bmRzKVxuICAgIGRvbS5hcHBlbmRDaGlsZChoZWFkKVxuXG4gICAgdmFyIHVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKVxuICAgIHVsLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19jaGlsZHJlbicpXG4gICAgZG9tLmFwcGVuZENoaWxkKHVsKVxuICAgIHRoaXMuZG9tW2lkXSA9IHttYWluOiBkb20sIGJvZHk6IGJvZHksIHVsOiB1bCwgaGVhZDogaGVhZH1cbiAgICByZXR1cm4gZG9tXG4gIH0sXG5cbiAgLyoqIFxuICAgKiBDcmVhdGUgYSBib2R5IG5vZGVcbiAgICpcbiAgICogaWQ6IHRoZSBub2RlIGlmXG4gICAqIGNvbnRlbnQ6IHRoZSB0ZXh0XG4gICAqIG1ldGE6IGFuIG9iamVjdCBvZiBtZXRhIGRhdGFcbiAgICogYm91bmRzOiBib3VuZCBhY3Rpb25zXG4gICAqL1xuICBib2R5Rm9yOiBmdW5jdGlvbiAoaWQsIGNvbnRlbnQsIG1ldGEsIGJvdW5kcykge1xuICAgIHZhciBkb20gPSBuZXcgdGhpcy5vLk5vZGUoY29udGVudCwgbWV0YSwgYm91bmRzLCBpZCA9PT0gJ25ldycpXG4gICAgZG9tLm5vZGUuY2xhc3NMaXN0LmFkZCgndHJlZWRfX2JvZHknKVxuICAgIHJldHVybiBkb21cbiAgfSxcblxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gRHJvcFNoYWRvdztcblxuZnVuY3Rpb24gRHJvcFNoYWRvdyhoZWlnaHQsIGNsc05hbWUpIHtcbiAgdGhpcy5ub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoY2xzTmFtZSB8fCAndHJlZWRfX2Ryb3Atc2hhZG93JylcbiAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgMTBcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpXG59XG5cbkRyb3BTaGFkb3cucHJvdG90eXBlID0ge1xuICBtb3ZlVG86IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICB0aGlzLm5vZGUuc3R5bGUudG9wID0gdGFyZ2V0LnNob3cueSAtIHRoaXMuaGVpZ2h0LzIgKyAncHgnXG4gICAgdGhpcy5ub2RlLnN0eWxlLmxlZnQgPSB0YXJnZXQuc2hvdy5sZWZ0ICsgJ3B4J1xuICAgIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSB0aGlzLmhlaWdodCArICdweCdcbiAgICAvLyB0aGlzLm5vZGUuc3R5bGUuaGVpZ2h0ID0gdGFyZ2V0LmhlaWdodCArIDEwICsgJ3B4J1xuICAgIHRoaXMubm9kZS5zdHlsZS53aWR0aCA9IHRhcmdldC5zaG93LndpZHRoICsgJ3B4J1xuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZSlcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICBOb2RlOiByZXF1aXJlKCcuL2RlZmF1bHQtbm9kZScpLFxuICBWaWV3OiByZXF1aXJlKCcuL3ZpZXcnKSxcbiAgVmlld0xheWVyOiByZXF1aXJlKCcuL2RvbS12bCcpLFxuICBNb2RlbDogcmVxdWlyZSgnLi9tb2RlbCcpLFxuICBDb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXInKSxcbiAgcGw6IHtcbiAgICBMb2NhbDogcmVxdWlyZSgnLi9sb2NhbC1wbCcpLFxuICAgIE1lbTogcmVxdWlyZSgnLi9tZW0tcGwnKVxuICB9LFxuICBza2luczoge1xuICAgIHdmOiByZXF1aXJlKCcuLi9za2lucy93b3JrZmxvd3knKSxcbiAgICB3YjogcmVxdWlyZSgnLi4vc2tpbnMvd2hpdGVib2FyZCcpXG4gIH1cbn1cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNcblxua2V5cy5rZXlOYW1lID0ga2V5TmFtZVxuXG52YXIgS0VZUyA9IHtcbiAgODogJ2JhY2tzcGFjZScsXG4gIDk6ICd0YWInLFxuICAxMzogJ3JldHVybicsXG4gIDI3OiAnZXNjYXBlJyxcbiAgMzc6ICdsZWZ0JyxcbiAgMzg6ICd1cCcsXG4gIDM5OiAncmlnaHQnLFxuICA0MDogJ2Rvd24nLFxuICA0NjogJ2RlbGV0ZScsXG4gIDExMzogJ2YyJyxcbiAgMjE5OiAnWycsXG4gIDIyMTogJ10nXG59XG5cbmZ1bmN0aW9uIGtleU5hbWUoY29kZSkge1xuICBpZiAoY29kZSA8PSA5MCAmJiBjb2RlID49IDY1KSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSArIDMyKVxuICB9XG4gIHJldHVybiBLRVlTW2NvZGVdXG59XG5cbmZ1bmN0aW9uIGtleXMoY29uZmlnKSB7XG4gIHZhciBrbWFwID0ge31cbiAgICAsIHByZWZpeGVzID0ge31cbiAgICAsIGN1cl9wcmVmaXggPSBudWxsXG4gICAgLCBwYXJ0c1xuICAgICwgcGFydFxuICAgICwgc2VxXG4gIGZvciAodmFyIGtleSBpbiBjb25maWcpIHtcbiAgICBwYXJ0cyA9IGtleS5zcGxpdCgnLCcpXG4gICAgZm9yICh2YXIgaT0wO2k8cGFydHMubGVuZ3RoO2krKykge1xuICAgICAgcGFydCA9IHBhcnRzW2ldLnRyaW0oKVxuICAgICAga21hcFtwYXJ0XSA9IGNvbmZpZ1trZXldXG4gICAgICBpZiAocGFydC5pbmRleE9mKCcgJykgIT09IC0xKSB7XG4gICAgICAgIHNlcSA9IHBhcnQuc3BsaXQoL1xccysvZylcbiAgICAgICAgdmFyIG4gPSAnJ1xuICAgICAgICBmb3IgKHZhciBqPTA7IGo8c2VxLmxlbmd0aC0xOyBqKyspIHtcbiAgICAgICAgICBuICs9IHNlcVtqXVxuICAgICAgICAgIHByZWZpeGVzW25dID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBrZXkgPSBrZXlOYW1lKGUua2V5Q29kZSlcbiAgICBpZiAoIWtleSkge1xuICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKGUua2V5Q29kZSlcbiAgICB9XG4gICAgaWYgKGUuYWx0S2V5KSBrZXkgPSAnYWx0KycgKyBrZXlcbiAgICBpZiAoZS5zaGlmdEtleSkga2V5ID0gJ3NoaWZ0KycgKyBrZXlcbiAgICBpZiAoZS5jdHJsS2V5KSBrZXkgPSAnY3RybCsnICsga2V5XG4gICAgaWYgKGUubWV0YUtleSkga2V5ID0gJ21ldGErJyArIGtleVxuICAgIGlmIChjdXJfcHJlZml4KSB7XG4gICAgICBrZXkgPSBjdXJfcHJlZml4ICsgJyAnICsga2V5XG4gICAgICBjdXJfcHJlZml4ID0gbnVsbFxuICAgIH1cbiAgICBpZiAoIWttYXBba2V5XSkge1xuICAgICAgaWYgKHByZWZpeGVzW2tleV0pIHtcbiAgICAgICAgY3VyX3ByZWZpeCA9IGtleVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VyX3ByZWZpeCA9IG51bGxcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoa21hcFtrZXldLmNhbGwodGhpcywgZSkgIT09IHRydWUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG59XG5cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsUExcblxuZnVuY3Rpb24gTG9jYWxQTChvcHRzKSB7XG4gIHRoaXMucHJlZml4ID0gKG9wdHMucHJlZml4IHx8ICdsb2NhbCcpICsgJzonXG59XG5cbkxvY2FsUEwucHJvdG90eXBlID0ge1xuICBpbml0OiBmdW5jdGlvbiAoZG9uZSkge1xuICAgIC8vIFhYWDogYXJlIHRoZXJlIGFueSBwb3RlbnRpYWwgZXJyb3JzP1xuICAgIGRvbmUoKVxuICB9LFxuICByZW1vdGU6IGZhbHNlLFxuICBjYW5UcmFja1VwZGF0ZXM6IGZhbHNlLFxuXG4gIHNhdmU6IGZ1bmN0aW9uICh0eXBlLCBpZCwgZGF0YSwgZG9uZSkge1xuICAgIGxvY2FsU3RvcmFnZVt0aGlzLnByZWZpeCArIHR5cGUgKyAnOicgKyBpZF0gPSBKU09OLnN0cmluZ2lmeShkYXRhKVxuICAgIGRvbmUgJiYgZG9uZSgpXG4gIH0sXG5cbiAgZmluZDogZnVuY3Rpb24gKHR5cGUsIGlkLCBkb25lKSB7XG4gICAgdmFyIGRhdGFcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW3RoaXMucHJlZml4ICsgdHlwZSArICc6JyArIGlkXSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZG9uZShlKVxuICAgIH1cbiAgICBkb25lKG51bGwsIGRhdGEpXG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAodHlwZSwgaWQsIHVwZGF0ZSwgZG9uZSkge1xuICAgIHRoaXMuZmluZCh0eXBlLCBpZCwgZnVuY3Rpb24gKGVyciwgbm9kZSkge1xuXG4gICAgICBpZiAoZXJyKSByZXR1cm4gZG9uZShlcnIpXG4gICAgICBmb3IgKHZhciBhdHRyIGluIHVwZGF0ZSkge1xuICAgICAgICBub2RlW2F0dHJdID0gdXBkYXRlW2F0dHJdXG4gICAgICB9XG4gICAgICB0aGlzLnNhdmUodHlwZSwgaWQsIG5vZGUsIGRvbmUpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKHR5cGUsIGlkLCBkb25lKSB7XG4gICAgZGVsZXRlIGxvY2FsU3RvcmFnZVt0aGlzLnByZWZpeCArIHR5cGUgKyAnOicgKyBpZF1cbiAgICBkb25lICYmIGRvbmUoKVxuICB9LFxuXG4gIGZpbmRBbGw6IGZ1bmN0aW9uICh0eXBlLCBkb25lKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICAgICwgZGF0YVxuICAgIGZvciAodmFyIGtleSBpbiBsb2NhbFN0b3JhZ2UpIHtcbiAgICAgIGlmIChrZXkuaW5kZXhPZih0aGlzLnByZWZpeCArIHR5cGUgKyAnOicpICE9PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBkb25lKGUpXG4gICAgICB9XG4gICAgICBpdGVtcy5wdXNoKGRhdGEpXG4gICAgfVxuICAgIGRvbmUobnVsbCwgaXRlbXMpXG4gIH0sXG5cbiAgbG9hZDogZnVuY3Rpb24gKGRhdGEsIGRvbmUsIGNsZWFyKSB7XG4gICAgaWYgKGNsZWFyKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIGlmIChrZXkuaW5kZXhPZih0aGlzLnByZWZpeCkgIT09IDApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgbG9jYWxTdG9yYWdlW2tleV1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaWQgaW4gZGF0YS5ub2Rlcykge1xuICAgICAgbG9jYWxTdG9yYWdlW3RoaXMucHJlZml4ICsgaWRdID0gSlNPTi5zdHJpbmdpZnkoZGF0YS5ub2Rlc1tpZF0pXG4gICAgfVxuICAgIGRvbmUgJiYgZG9uZSgpXG4gIH0sXG5cbiAgZHVtcDogZnVuY3Rpb24gKGRvbmUpIHtcbiAgICB2YXIgZGF0YSA9IHt9XG4gICAgICAsIGl0ZW1cbiAgICBmb3IgKHZhciBrZXkgaW4gbG9jYWxTdG9yYWdlKSB7XG4gICAgICBpZiAodGhpcy5wcmVmaXggJiYga2V5LmluZGV4T2YodGhpcy5wcmVmaXgpICE9PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgaXRlbSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlW2tleV0pXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkZhaWxlZCB0byBwYXJzZSBpdGVtXCIsIGtleSwgXCJ3aGlsZSBkdW1waW5nXCIpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZGF0YVtrZXkuc2xpY2UodGhpcy5wcmVmaXgubGVuZ3RoKV0gPSBpdGVtXG4gICAgfVxuICAgIGRvbmUobnVsbCwge25vZGVzOiBkYXRhfSlcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gTWVtUExcblxuZnVuY3Rpb24gTWVtUEwoKSB7XG4gIHRoaXMuZGF0YSA9IHt9XG59XG5cbk1lbVBMLnByb3RvdHlwZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24gKGRvbmUpIHtcbiAgICBkb25lKClcbiAgfSxcblxuICBzYXZlOiBmdW5jdGlvbiAodHlwZSwgaWQsIGRhdGEsIGRvbmUpIHtcbiAgICBpZiAoIXRoaXMuZGF0YVt0eXBlXSkge1xuICAgICAgdGhpcy5kYXRhW3R5cGVdID0ge31cbiAgICB9XG4gICAgdGhpcy5kYXRhW3R5cGVdW2lkXSA9IGRhdGFcbiAgICBkb25lICYmIGRvbmUoKVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHR5cGUsIGlkLCB1cGRhdGUsIGRvbmUpIHtcbiAgICBmb3IgKHZhciBhdHRyIGluIHVwZGF0ZSkge1xuICAgICAgdGhpcy5kYXRhW3R5cGVdW2lkXVthdHRyXSA9IHVwZGF0ZVthdHRyXVxuICAgIH1cbiAgICBkb25lICYmIGRvbmUoKVxuICB9LFxuXG4gIGZpbmRBbGw6IGZ1bmN0aW9uICh0eXBlLCBkb25lKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICBpZiAodGhpcy5kYXRhW3R5cGVdKSB7XG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmRhdGFbdHlwZV0pIHtcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLmRhdGFbdHlwZV1baWRdKVxuICAgICAgfVxuICAgIH1cbiAgICBkb25lKG51bGwsIGl0ZW1zKVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKHR5cGUsIGlkLCBkb25lKSB7XG4gICAgZGVsZXRlIHRoaXMuZGF0YVt0eXBlXVtpZF1cbiAgICBkb25lICYmIGRvbmUoKVxuICB9LFxuXG4gIGxvYWQ6IGZ1bmN0aW9uIChkYXRhLCBkb25lLCBjbGVhcikge1xuICAgIGRvbmUgJiYgZG9uZSgpO1xuICB9LFxuXG4gIGR1bXA6IGZ1bmN0aW9uIChkb25lKSB7XG4gICAgZG9uZShudWxsLCB7bm9kZXM6IHt9fSk7XG4gIH1cbn1cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsXG5cblxuZnVuY3Rpb24gTW9kZWwocm9vdCwgaWRzLCBkYikge1xuICB0aGlzLmlkcyA9IGlkc1xuICB0aGlzLnJvb3QgPSByb290XG4gIHRoaXMuZGIgPSBkYlxuICB0aGlzLm5leHRpZCA9IDEwMFxuICB0aGlzLmNsaXBib2FyZCA9IGZhbHNlXG59XG5cbi8qKlxuICogQSBzaW5nbGUgbm9kZSBpc1xuICogLSBpZDpcbiAqIC0gcGFyZW50OiBpZFxuICogLSBjaGlsZHJlbjogW2lkLCBpZCwgaWRdXG4gKiAtIGRhdGE6IHt9XG4gKi9cblxuTW9kZWwucHJvdG90eXBlID0ge1xuICBuZXdpZDogZnVuY3Rpb24gKCkge1xuICAgIHdoaWxlICh0aGlzLmlkc1t0aGlzLm5leHRpZF0pIHtcbiAgICAgIHRoaXMubmV4dGlkICs9IDFcbiAgICB9XG4gICAgdmFyIGlkID0gdGhpcy5uZXh0aWRcbiAgICB0aGlzLm5leHRpZCArPSAxXG4gICAgcmV0dXJuIGlkXG4gIH0sXG5cbiAgLy8gZXhwb3J0IGFsbCB0aGUgZGF0YSBjdXJyZW50bHkgc3RvcmVkIGluIHRoZSBtb2RlbFxuICAvLyBkdW1wRGF0YSgpIC0+IGFsbCBvZiBpdFxuICAvLyBkdW1wRGF0YShpZCkgLT4gY2hpbGRyZW4gb2YgdGhlIGdpdmVuIGlkXG4gIC8vIGR1bXBEYXRhKGlkLCB0cnVlKSAtPiBpbmNsdWRlIHRoZSBpZHMgaW4gdGhlIGR1bXBcbiAgLy8ge1xuICAvLyAgICBpZDogPz8sXG4gIC8vICAgIG1ldGE6IHt9LFxuICAvLyAgICBjb2xsYXBzZWQ6ID8/LFxuICAvLyAgICBjb250ZW50OiAnJyxcbiAgLy8gICAgY2hpbGRyZW46IFtyZWN1cnNlLCAuLi5dXG4gIC8vIH1cbiAgZHVtcERhdGE6IGZ1bmN0aW9uIChpZCwgbm9pZHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWQgPSB0aGlzLnJvb3RcbiAgICB9XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgICBtZXRhOiB7fSxcbiAgICAgICAgfVxuICAgICAgLCBuID0gdGhpcy5pZHNbaWRdXG4gICAgcmVzLmNvbnRlbnQgPSBuLmNvbnRlbnRcbiAgICByZXMuY3JlYXRlZCA9IG4uY3JlYXRlZFxuICAgIHJlcy50eXBlID0gbi50eXBlXG4gICAgcmVzLm1vZGlmaWVkID0gbi5tb2RpZmllZFxuICAgIGZvciAodmFyIGF0dHIgaW4gbi5tZXRhKSB7XG4gICAgICByZXMubWV0YVthdHRyXSA9IG4ubWV0YVthdHRyXVxuICAgIH1cbiAgICBpZiAobi5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIHJlcy5jaGlsZHJlbiA9IFtdXG4gICAgICBmb3IgKHZhciBpPTA7IGk8bi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXMuY2hpbGRyZW4ucHVzaCh0aGlzLmR1bXBEYXRhKG4uY2hpbGRyZW5baV0sIG5vaWRzKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFub2lkcykgcmVzLmlkID0gaWRcbiAgICByZXMuY29sbGFwc2VkID0gbi5jb2xsYXBzZWRcbiAgICByZXR1cm4gcmVzXG4gIH0sXG5cbiAgLy8gY3JlYXRlTm9kZXMocGFyZW50SWQsIHRoZSBpbmRleCwgZGF0YSBhcyBpdCB3YXMgZHVtcGVkKVxuICAvLyB7XG4gIC8vICAgIGNvbnRlbnQ6IFwiXCIsXG4gIC8vICAgIG1ldGE6IHt9XG4gIC8vICAgIC4uLiBvdGhlciBkYXRhc1xuICAvLyAgICBjaGlsZHJlbjogW25vZGUsIC4uLl1cbiAgLy8gfVxuICBjcmVhdGVOb2RlczogZnVuY3Rpb24gKHBpZCwgaW5kZXgsIGRhdGEpIHtcbiAgICB2YXIgY3IgPSB0aGlzLmNyZWF0ZShwaWQsIGluZGV4LCBkYXRhLmNvbnRlbnQsIGRhdGEudHlwZSwgZGF0YS5tZXRhKVxuICAgIGNyLm5vZGUuY29sbGFwc2VkID0gZGF0YS5jb2xsYXBzZWRcbiAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5jcmVhdGVOb2Rlcyhjci5ub2RlLmlkLCBpLCBkYXRhLmNoaWxkcmVuW2ldKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY3JcbiAgfSxcblxuICBnZXRCZWZvcmU6IGZ1bmN0aW9uIChwaWQsIGluZGV4KSB7XG4gICAgdmFyIGJlZm9yZSA9IGZhbHNlXG4gICAgaWYgKGluZGV4IDwgdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5sZW5ndGggLSAxKSB7XG4gICAgICBiZWZvcmUgPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuW2luZGV4ICsgMV1cbiAgICB9XG4gICAgcmV0dXJuIGJlZm9yZVxuICB9LFxuXG4gIC8vIG9wZXJhdGlvbnNcbiAgY3JlYXRlOiBmdW5jdGlvbiAocGlkLCBpbmRleCwgdGV4dCwgdHlwZSwgbWV0YSkge1xuICAgIHZhciBub2RlID0ge1xuICAgICAgaWQ6IHRoaXMubmV3aWQoKSxcbiAgICAgIGNvbnRlbnQ6IHRleHQsXG4gICAgICB0eXBlOiB0eXBlIHx8ICdiYXNlJyxcbiAgICAgIG1ldGE6IG1ldGEgfHwge30sXG4gICAgICBwYXJlbnQ6IHBpZCxcbiAgICAgIGNoaWxkcmVuOiBbXVxuICAgIH1cbiAgICB0aGlzLmlkc1tub2RlLmlkXSA9IG5vZGVcbiAgICB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLnNwbGljZShpbmRleCwgMCwgbm9kZS5pZClcblxuICAgIHZhciBiZWZvcmUgPSBmYWxzZVxuICAgIGlmIChpbmRleCA8IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xuICAgICAgYmVmb3JlID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbltpbmRleCArIDFdXG4gICAgfVxuXG4gICAgdGhpcy5kYi5zYXZlKCdub2RlJywgbm9kZS5pZCwgbm9kZSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIHBpZCwge2NoaWxkcmVuOiB0aGlzLmlkc1twaWRdLmNoaWxkcmVufSlcblxuICAgIHJldHVybiB7XG4gICAgICBub2RlOiBub2RlLFxuICAgICAgYmVmb3JlOiBiZWZvcmVcbiAgICB9XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoaWQgPT09IHRoaXMucm9vdCkgcmV0dXJuXG4gICAgdmFyIG4gPSB0aGlzLmlkc1tpZF1cbiAgICAgICwgcCA9IHRoaXMuaWRzW24ucGFyZW50XVxuICAgICAgLCBpeCA9IHAuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICBwLmNoaWxkcmVuLnNwbGljZShpeCwgMSlcbiAgICBkZWxldGUgdGhpcy5pZHNbaWRdXG5cbiAgICB0aGlzLmRiLnJlbW92ZSgnbm9kZScsIGlkKVxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgbi5wYXJlbnQsIHtjaGlsZHJlbjogcC5jaGlsZHJlbn0pXG4gICAgLy8gVE9ETzogcmVtb3ZlIGFsbCBjaGlsZCBub2Rlc1xuXG4gICAgcmV0dXJuIHtpZDogaWQsIG5vZGU6IG4sIGl4OiBpeH1cbiAgfSxcblxuICBzZXRDb250ZW50OiBmdW5jdGlvbiAoaWQsIGNvbnRlbnQpIHtcbiAgICB0aGlzLmlkc1tpZF0uY29udGVudCA9IGNvbnRlbnRcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7Y29udGVudDogY29udGVudH0pXG4gIH0sXG5cbiAgc2V0QXR0cjogZnVuY3Rpb24gKGlkLCBhdHRyLCB2YWx1ZSkge1xuICAgIHRoaXMuaWRzW2lkXS5tZXRhW2F0dHJdID0gdmFsdWVcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7bWV0YTogdGhpcy5pZHNbaWRdLm1ldGF9KVxuICB9LFxuXG4gIHNldE1ldGE6IGZ1bmN0aW9uIChpZCwgbWV0YSkge1xuICAgIGZvciAodmFyIGF0dHIgaW4gbWV0YSkge1xuICAgICAgdGhpcy5pZHNbaWRdLm1ldGFbYXR0cl0gPSBtZXRhW2F0dHJdXG4gICAgfVxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgaWQsIHttZXRhOiBtZXRhfSlcbiAgfSxcblxuICAvLyBvdGhlciBzdHVmZlxuICBzZXRDb2xsYXBzZWQ6IGZ1bmN0aW9uIChpZCwgaXNDb2xsYXBzZWQpIHtcbiAgICB0aGlzLmlkc1tpZF0uY29sbGFwc2VkID0gaXNDb2xsYXBzZWRcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7Y29sbGFwc2VkOiBpc0NvbGxhcHNlZH0pXG4gIH0sXG5cbiAgaXNDb2xsYXBzZWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiB0aGlzLmlkc1tpZF0uY29sbGFwc2VkXG4gIH0sXG5cbiAgaGFzQ2hpbGRyZW46IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiB0aGlzLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoXG4gIH0sXG5cbiAgLy8gYWRkIGJhY2sgc29tZXRoaW5nIHRoYXQgd2FzIHJlbW92ZWRcbiAgcmVhZGQ6IGZ1bmN0aW9uIChzYXZlZCkge1xuICAgIHRoaXMuaWRzW3NhdmVkLmlkXSA9IHNhdmVkLm5vZGVcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmlkc1tzYXZlZC5ub2RlLnBhcmVudF0uY2hpbGRyZW5cbiAgICBjaGlsZHJlbi5zcGxpY2Uoc2F2ZWQuaXgsIDAsIHNhdmVkLmlkKVxuICAgIHZhciBiZWZvcmUgPSBmYWxzZVxuICAgIGlmIChzYXZlZC5peCA8IGNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgIGJlZm9yZSA9IGNoaWxkcmVuW3NhdmVkLml4ICsgMV1cbiAgICB9XG4gICAgdGhpcy5kYi5zYXZlKCdub2RlJywgc2F2ZWQubm9kZS5pZCwgc2F2ZWQubm9kZSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIHNhdmVkLm5vZGUucGFyZW50LCB7Y2hpbGRyZW46IGNoaWxkcmVufSlcbiAgICByZXR1cm4gYmVmb3JlXG4gIH0sXG5cbiAgbW92ZTogZnVuY3Rpb24gKGlkLCBwaWQsIGluZGV4KSB7XG4gICAgdmFyIG4gPSB0aGlzLmlkc1tpZF1cbiAgICAgICwgb3BpZCA9IG4ucGFyZW50XG4gICAgICAsIHAgPSB0aGlzLmlkc1tvcGlkXVxuICAgICAgLCBpeCA9IHAuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICBwLmNoaWxkcmVuLnNwbGljZShpeCwgMSlcbiAgICBpZiAoaW5kZXggPT09IGZhbHNlKSBpbmRleCA9IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoXG4gICAgdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDAsIGlkKVxuICAgIHRoaXMuaWRzW2lkXS5wYXJlbnQgPSBwaWRcblxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgb3BpZCwge2NoaWxkcmVuOiBwLmNoaWxkcmVufSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIHBpZCwge2NoaWxkcmVuOiB0aGlzLmlkc1twaWRdLmNoaWxkcmVufSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7cGFyZW50OiBwaWR9KVxuXG4gICAgdmFyIGJlZm9yZSA9IGZhbHNlXG4gICAgaWYgKGluZGV4IDwgdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5sZW5ndGggLSAxKSB7XG4gICAgICBiZWZvcmUgPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuW2luZGV4ICsgMV1cbiAgICB9XG4gICAgcmV0dXJuIGJlZm9yZVxuICB9LFxuXG4gIGFwcGVuZFRleHQ6IGZ1bmN0aW9uIChpZCwgdGV4dCkge1xuICAgIHRoaXMuaWRzW2lkXS5jb250ZW50ICs9IHRleHRcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7Y29udGVudDogdGhpcy5pZHNbaWRdLmNvbnRlbnR9KVxuICB9LFxuXG4gIC8vIG1vdmVtZW50IGNhbGN1bGF0aW9uXG4gIGdldFBhcmVudDogZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgfSxcblxuICBjb21tb25QYXJlbnQ6IGZ1bmN0aW9uIChvbmUsIHR3bykge1xuICAgIGlmIChvbmUgPT09IHR3bykgcmV0dXJuIG9uZVxuICAgIHZhciBvbmVzID0gW29uZV1cbiAgICAgICwgdHdvcyA9IFt0d29dXG4gICAgd2hpbGUgKHRoaXMuaWRzW29uZV0ucGFyZW50IHx8IHRoaXMuaWRzW3R3b10ucGFyZW50KSB7XG4gICAgICBpZiAodGhpcy5pZHNbb25lXS5wYXJlbnQpIHtcbiAgICAgICAgb25lID0gdGhpcy5pZHNbb25lXS5wYXJlbnRcbiAgICAgICAgaWYgKHR3b3MuaW5kZXhPZihvbmUpICE9PSAtMSkgcmV0dXJuIG9uZVxuICAgICAgICBvbmVzLnB1c2gob25lKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaWRzW3R3b10ucGFyZW50KSB7XG4gICAgICAgIHR3byA9IHRoaXMuaWRzW3R3b10ucGFyZW50XG4gICAgICAgIGlmIChvbmVzLmluZGV4T2YodHdvKSAhPT0gLTEpIHJldHVybiB0d29cbiAgICAgICAgdHdvcy5wdXNoKHR3bylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBnZXRDaGlsZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKHRoaXMuaWRzW2lkXS5jaGlsZHJlbiAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZHNbaWRdLmNoaWxkcmVuWzBdXG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5leHRTaWJsaW5nKGlkKVxuICB9LFxuXG4gIHByZXZTaWJsaW5nOiBmdW5jdGlvbiAoaWQsIG5vcGFyZW50KSB7XG4gICAgdmFyIHBpZCA9IHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgICBpZiAodW5kZWZpbmVkID09PSBwaWQpIHJldHVyblxuICAgIHZhciBpeCA9IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICBpZiAoaXggPiAwKSByZXR1cm4gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbltpeC0xXVxuICAgIGlmICghbm9wYXJlbnQpIHJldHVybiBwaWRcbiAgfSxcblxuICBjbG9zZXN0Tm9uQ2hpbGQ6IGZ1bmN0aW9uIChpZCwgb3RoZXJzKSB7XG4gICAgdmFyIGNsb3Nlc3QgPSB0aGlzLm5leHRTaWJsaW5nKGlkLCB0cnVlKVxuICAgIGlmICh1bmRlZmluZWQgPT09IGNsb3Nlc3QgfHwgY2xvc2VzdCA9PT0gZmFsc2UpIHtcbiAgICAgIGlmIChvdGhlcnMpIHtcbiAgICAgICAgY2xvc2VzdCA9IHRoaXMuaWRBYm92ZShvdGhlcnNbMF0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbG9zZXN0ID0gdGhpcy5pZEFib3ZlKGlkKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xvc2VzdFxuICB9LFxuXG4gIG5leHRTaWJsaW5nOiBmdW5jdGlvbiAoaWQsIHN0cmljdCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gcGlkKSByZXR1cm4gIXN0cmljdCAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW5bMF1cbiAgICB2YXIgaXggPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4IDwgdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5sZW5ndGggLSAxKSByZXR1cm4gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbltpeCArIDFdXG4gICAgaWYgKHRoaXMuaWRzW2lkXS5jb2xsYXBzZWQpIHtcbiAgICAgIHJldHVybiAhc3RyaWN0ICYmIHRoaXMubmV4dFNpYmxpbmcocGlkLCBzdHJpY3QpXG4gICAgfVxuICAgIHJldHVybiAhc3RyaWN0ICYmIHRoaXMuaWRzW2lkXS5jaGlsZHJlblswXVxuICB9LFxuXG4gIGxhc3RTaWJsaW5nOiBmdW5jdGlvbiAoaWQsIHN0cmljdCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gcGlkKSByZXR1cm4gIXN0cmljdCAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW5bMF1cbiAgICB2YXIgaXggPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4ID09PSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmxlbmd0aCAtIDEpIHJldHVybiAhc3RyaWN0ICYmIHRoaXMuaWRzW2lkXS5jaGlsZHJlblswXVxuICAgIHJldHVybiB0aGlzLmlkc1twaWRdLmNoaWxkcmVuW3RoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgfSxcblxuICBmaXJzdFNpYmxpbmc6IGZ1bmN0aW9uIChpZCwgc3RyaWN0KSB7XG4gICAgdmFyIHBpZCA9IHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgICBpZiAodW5kZWZpbmVkID09PSBwaWQpIHJldHVybiAvLyB0aGlzLmlkc1tpZF0uY2hpbGRyZW5bMF1cbiAgICB2YXIgaXggPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4ID09PSAwKSByZXR1cm4gIXN0cmljdCAmJiBwaWRcbiAgICByZXR1cm4gdGhpcy5pZHNbcGlkXS5jaGlsZHJlblswXVxuICB9LFxuXG4gIGxhc3RPcGVuOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuaWRzW2lkXVxuICAgIHdoaWxlIChub2RlLmNoaWxkcmVuLmxlbmd0aCAmJiAobm9kZS5pZCA9PT0gaWQgfHwgIW5vZGUuY29sbGFwc2VkKSkge1xuICAgICAgbm9kZSA9IHRoaXMuaWRzW25vZGUuY2hpbGRyZW5bbm9kZS5jaGlsZHJlbi5sZW5ndGggLSAxXV1cbiAgICB9XG4gICAgcmV0dXJuIG5vZGUuaWRcbiAgfSxcblxuICBpZEFib3ZlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgICAgLCBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgIHZhciBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKCtpZClcbiAgICBpZiAoaXggPT09IDApIHtcbiAgICAgIHJldHVybiBwaWRcbiAgICB9XG4gICAgdmFyIHByZXZpZCA9IHBhcmVudC5jaGlsZHJlbltpeCAtIDFdXG4gICAgd2hpbGUgKHRoaXMuaWRzW3ByZXZpZF0uY2hpbGRyZW4gJiZcbiAgICAgICAgICAgdGhpcy5pZHNbcHJldmlkXS5jaGlsZHJlbi5sZW5ndGggJiZcbiAgICAgICAgICAgIXRoaXMuaWRzW3ByZXZpZF0uY29sbGFwc2VkKSB7XG4gICAgICBwcmV2aWQgPSB0aGlzLmlkc1twcmV2aWRdLmNoaWxkcmVuW3RoaXMuaWRzW3ByZXZpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICB9XG4gICAgcmV0dXJuIHByZXZpZFxuICB9LFxuXG4gIC8vIGdldCB0aGUgcGxhY2UgdG8gc2hpZnQgbGVmdCB0b1xuICBzaGlmdExlZnRQbGFjZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHBpZCA9IHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgICAgICwgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgIGlmICghcGFyZW50KSByZXR1cm5cbiAgICB2YXIgcHBpZCA9IHBhcmVudC5wYXJlbnRcbiAgICAgICwgcHBhcmVudCA9IHRoaXMuaWRzW3BwaWRdXG4gICAgaWYgKCFwcGFyZW50KSByZXR1cm5cbiAgICB2YXIgcGl4ID0gcHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKHBpZClcbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwcGlkLFxuICAgICAgaXg6IHBpeCArIDFcbiAgICB9XG4gIH0sXG5cbiAgc2hpZnRVcFBsYWNlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgICAgLCBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgIHZhciBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA9PT0gMCkge1xuICAgICAgdmFyIHBsID0gdGhpcy5zaGlmdExlZnRQbGFjZShpZClcbiAgICAgIGlmICghcGwpIHJldHVyblxuICAgICAgcGwuaXggLT0gMVxuICAgICAgcmV0dXJuIHBsXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGl4OiBpeCAtIDFcbiAgICB9XG4gIH0sXG5cbiAgc2hpZnREb3duUGxhY2U6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudCA9IHRoaXMuaWRzW3BpZF1cbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuXG4gICAgdmFyIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4ID49IHBhcmVudC5jaGlsZHJlbi5sZW5ndGggLSAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaGlmdExlZnRQbGFjZShpZClcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHBpZDogcGlkLFxuICAgICAgaXg6IGl4ICsgMVxuICAgIH1cbiAgfSxcblxuICBtb3ZlQmVmb3JlUGxhY2U6IGZ1bmN0aW9uIChpZCwgdGlkKSB7XG4gICAgdmFyIHNpYiA9IHRoaXMuaWRzW2lkXVxuICAgICAgLCBwaWQgPSBzaWIucGFyZW50XG4gICAgICAsIG9waWQgPSB0aGlzLmlkc1t0aWRdLnBhcmVudFxuICAgIGlmICh1bmRlZmluZWQgPT09IHBpZCkgcmV0dXJuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuaWRzW3BpZF1cbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwaWQsXG4gICAgICBpeDogcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgfVxuICB9LFxuXG4gIG1vdmVBZnRlclBsYWNlOiBmdW5jdGlvbiAoaWQsIG9pZCkge1xuICAgIHZhciBzaWIgPSB0aGlzLmlkc1tpZF1cbiAgICAgICwgcGlkID0gc2liLnBhcmVudFxuICAgICAgLCBvcGlkID0gdGhpcy5pZHNbb2lkXS5wYXJlbnRcbiAgICBpZiAodW5kZWZpbmVkID09PSBwaWQpIHJldHVyblxuICAgIHZhciBvaXggPSB0aGlzLmlkc1tvcGlkXS5jaGlsZHJlbi5pbmRleE9mKG9pZClcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgICAgLCBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKSArIDFcbiAgICBpZiAoIHBpZCA9PT0gb3BpZCAmJiBpeCA+IG9peCkgaXggLT0gMVxuICAgIHJldHVybiB7XG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGl4OiBpeFxuICAgIH1cbiAgfSxcblxuICBpZEJlbG93OiBmdW5jdGlvbiAoaWQsIHJvb3QpIHtcbiAgICBpZiAodGhpcy5pZHNbaWRdLmNoaWxkcmVuICYmXG4gICAgICAgIHRoaXMuaWRzW2lkXS5jaGlsZHJlbi5sZW5ndGggJiZcbiAgICAgICAgKGlkID09PSByb290IHx8ICF0aGlzLmlkc1tpZF0uY29sbGFwc2VkKSkge1xuICAgICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5jaGlsZHJlblswXVxuICAgIH1cbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgICAgLCBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgIHZhciBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIHdoaWxlIChpeCA9PT0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgIGlmIChwYXJlbnQuaWQgPT09IHJvb3QpIHJldHVyblxuICAgICAgcGFyZW50ID0gdGhpcy5pZHNbcGFyZW50LnBhcmVudF1cbiAgICAgIGlmICghcGFyZW50KSByZXR1cm5cbiAgICAgIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YocGlkKVxuICAgICAgcGlkID0gcGFyZW50LmlkXG4gICAgfVxuICAgIHJldHVybiBwYXJlbnQuY2hpbGRyZW5baXggKyAxXVxuICB9LFxuXG4gIGlkTmV3OiBmdW5jdGlvbiAoaWQsIGJlZm9yZSwgcm9vdCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudFxuICAgICAgLCBuaXhcbiAgICBpZiAoYmVmb3JlKSB7XG4gICAgICBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgICBuaXggPSBwYXJlbnQuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICB9IGVsc2UgaWYgKGlkID09PSB0aGlzLnJvb3QgfHxcbiAgICAgICAgcm9vdCA9PT0gaWQgfHxcbiAgICAgICAgKHRoaXMuaWRzW2lkXS5jaGlsZHJlbiAmJlxuICAgICAgICB0aGlzLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoICYmXG4gICAgICAgICF0aGlzLmlkc1tpZF0uY29sbGFwc2VkKSkge1xuICAgICAgcGlkID0gaWRcbiAgICAgIG5peCA9IDBcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgICAgbml4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpICsgMVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwaWQsXG4gICAgICBpbmRleDogbml4XG4gICAgfVxuICB9LFxuXG4gIHNhbWVQbGFjZTogZnVuY3Rpb24gKGlkLCBwbGFjZSkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKCFwaWQgfHwgcGlkICE9PSBwbGFjZS5waWQpIHJldHVybiBmYWxzZVxuICAgIHZhciBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgICAsIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgcmV0dXJuIGl4ID09PSBwbGFjZS5peFxuICB9LFxuXG4gIGZpbmRDb2xsYXBzZXI6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICgoIXRoaXMuaWRzW2lkXS5jaGlsZHJlbiB8fFxuICAgICAgICAgIXRoaXMuaWRzW2lkXS5jaGlsZHJlbi5sZW5ndGggfHxcbiAgICAgICAgIHRoaXMuaWRzW2lkXS5jb2xsYXBzZWQpICYmXG4gICAgICAgIHRoaXMuaWRzW2lkXS5wYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgfVxuICAgIHJldHVybiBpZFxuICB9LFxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2xpZGVEb3duKG5vZGUpIHtcbiAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSlcbiAgICAsIGhlaWdodCA9IHN0eWxlLmhlaWdodFxuICBpZiAoIXBhcnNlSW50KGhlaWdodCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICBub2RlLnN0eWxlLmhlaWdodCA9IDBcbiAgbm9kZS5zdHlsZS50cmFuc2l0aW9uID0gJ2hlaWdodCAuMnMgZWFzZSdcbiAgbm9kZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nXG4gIGNvbnNvbGUubG9nKGhlaWdodClcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygneScsIGhlaWdodClcbiAgICBub2RlLnN0eWxlLmhlaWdodCA9IGhlaWdodFxuICB9LCAwKVxuXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZpbilcbiAgZnVuY3Rpb24gZmluKCkge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZpbilcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCd0cmFuc2l0aW9uJylcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdoZWlnaHQnKVxuICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ292ZXJmbG93JylcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2xpZGVVcChub2RlLCBkb25lKSB7XG4gIC8qXG4gIGFuaW1hdGUobm9kZSwge1xuICAgIGhlaWdodDoge1xuICAgICAgZnJvbTogJ2N1cnJlbnQnLFxuICAgICAgdG86IDBcbiAgICB9XG4gIH0sIGRvbmUpXG4gICovXG4gIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpXG4gICAgLCBoZWlnaHQgPSBzdHlsZS5oZWlnaHRcbiAgaWYgKCFwYXJzZUludChoZWlnaHQpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHRcbiAgbm9kZS5zdHlsZS50cmFuc2l0aW9uID0gJ2hlaWdodCAuMnMgZWFzZSdcbiAgbm9kZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nXG5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgbm9kZS5zdHlsZS5oZWlnaHQgPSAwXG4gIH0sIDApXG5cbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZmluKVxuICBmdW5jdGlvbiBmaW4oKSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZmluKVxuICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RyYW5zaXRpb24nKVxuICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ2hlaWdodCcpXG4gICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnb3ZlcmZsb3cnKVxuICAgIGRvbmUoKVxuICB9XG59XG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICBleHRlbmQ6IGV4dGVuZCxcbiAgbWVyZ2U6IG1lcmdlLFxuICBlbnN1cmVJblZpZXc6IGVuc3VyZUluVmlldyxcbiAgbWFrZV9saXN0ZWQ6IG1ha2VfbGlzdGVkXG59XG5cbmZ1bmN0aW9uIG1lcmdlKGEsIGIpIHtcbiAgdmFyIGMgPSB7fVxuICAgICwgZFxuICBmb3IgKGQgaW4gYSkge1xuICAgIGNbZF0gPSBhW2RdXG4gIH1cbiAgZm9yIChkIGluIGIpIHtcbiAgICBjW2RdID0gYltkXVxuICB9XG4gIHJldHVybiBjXG59XG5cbmZ1bmN0aW9uIGVuc3VyZUluVmlldyhpdGVtKSB7XG4gIHZhciBiYiA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgaWYgKGJiLnRvcCA8IDApIHJldHVybiBpdGVtLnNjcm9sbEludG9WaWV3KClcbiAgaWYgKGJiLmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXcoZmFsc2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0ZW5kKGRlc3QpIHtcbiAgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24gKHNyYykge1xuICAgIGZvciAodmFyIGF0dHIgaW4gc3JjKSB7XG4gICAgICAgIGRlc3RbYXR0cl0gPSBzcmNbYXR0cl1cbiAgICB9XG4gIH0pXG4gIHJldHVybiBkZXN0XG59XG5cbmZ1bmN0aW9uIGxvYWQoZGIsIHRyZWUpIHtcbiAgdmFyIHJlcyA9IG1ha2VfbGlzdGVkKHRyZWUsIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgZGIuc2F2ZSgncm9vdCcsIHtpZDogcmVzLmlkfSlcbiAgZm9yICh2YXIgaT0wOyBpPHJlcy50cmVlLmxlbmd0aDsgaSsrKSB7XG4gICAgZGIuc2F2ZSgnbm9kZScsIHJlcy50cmVlW2ldKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VfbGlzdGVkKGRhdGEsIG5leHRpZCwgY29sbGFwc2UpIHtcbiAgdmFyIGlkcyA9IHt9XG4gICAgLCBjaGlsZHJlbiA9IFtdXG4gICAgLCBuZGF0YSA9IHt9XG4gICAgLCByZXNcbiAgICAsIGlcbiAgaWYgKHVuZGVmaW5lZCA9PT0gbmV4dGlkKSBuZXh0aWQgPSAxMDBcblxuICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgIGZvciAoaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcyA9IG1ha2VfbGlzdGVkKGRhdGEuY2hpbGRyZW5baV0sIG5leHRpZCwgY29sbGFwc2UpXG4gICAgICBmb3IgKHZhciBpZCBpbiByZXMudHJlZSkge1xuICAgICAgICBpZHNbaWRdID0gcmVzLnRyZWVbaWRdXG4gICAgICAgIGlkc1tpZF0uZGVwdGggKz0gMVxuICAgICAgfVxuICAgICAgY2hpbGRyZW4ucHVzaChyZXMuaWQpXG4gICAgICBuZXh0aWQgPSByZXMuaWQgKyAxXG4gICAgfVxuICAgIC8vIGRlbGV0ZSBkYXRhLmNoaWxkcmVuXG4gIH1cbiAgZm9yICh2YXIgYXR0ciBpbiBkYXRhKSB7XG4gICAgaWYgKGF0dHIgPT09ICdjaGlsZHJlbicpIGNvbnRpbnVlO1xuICAgIG5kYXRhW2F0dHJdID0gZGF0YVthdHRyXVxuICB9XG4gIG5kYXRhLmRvbmUgPSBmYWxzZVxuICB2YXIgdGhlaWQgPSBkYXRhLmlkIHx8IG5leHRpZFxuICBpZHNbdGhlaWRdID0ge1xuICAgIGlkOiB0aGVpZCxcbiAgICBkYXRhOiBuZGF0YSxcbiAgICBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgY29sbGFwc2VkOiAhIWNvbGxhcHNlLFxuICAgIGRlcHRoOiAwXG4gIH1cbiAgZm9yIChpPTA7IGk8Y2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBpZHNbY2hpbGRyZW5baV1dLnBhcmVudCA9IHRoZWlkO1xuICB9XG4gIHJldHVybiB7aWQ6IHRoZWlkLCB0cmVlOiBpZHN9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBWaWV3XG5cbmZ1bmN0aW9uIHJldmVyc2VkKGl0ZW1zKSB7XG4gIHZhciBudyA9IFtdXG4gIGZvciAodmFyIGk9aXRlbXMubGVuZ3RoOyBpPjA7IGktLSkge1xuICAgIG53LnB1c2goaXRlbXNbaSAtIDFdKVxuICB9XG4gIHJldHVybiBud1xufVxuXG52YXIgRG9tVmlld0xheWVyID0gcmVxdWlyZSgnLi9kb20tdmwnKVxuICAsIERlZmF1bHROb2RlID0gcmVxdWlyZSgnLi9kZWZhdWx0LW5vZGUnKVxuICAsIER1bmdlb25zQW5kRHJhZ29ucyA9IHJlcXVpcmUoJy4vZG5kJylcbiAgLCBrZXlzID0gcmVxdWlyZSgnLi9rZXlzJylcbiAgLCB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcblxuLyoqXG4gKiBUaGUgYmFzaWMgdmlld1xuICpcbiAqIGJpbmRBY3Rpb25zOiBmbigpXG4gKiBtb2RlbDogdGhlIG1vZGVsXG4gKiBjdHJsOiB0aGUgY29udHJvbGxlclxuICogb3B0aW9uczogb3B0aW9ucyBoYXNoXG4gKi9cbmZ1bmN0aW9uIFZpZXcoYmluZEFjdGlvbnMsIG1vZGVsLCBjdHJsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHRoaXMubW9kZSA9ICdub3JtYWwnXG4gIHRoaXMuc2VsZWN0aW9uID0gbnVsbFxuICB0aGlzLnNlbF9pbnZlcnRlZCA9IGZhbHNlXG4gIHRoaXMuYWN0aXZlID0gbnVsbFxuICB0aGlzLm8gPSB1dGlsLmV4dGVuZCh7XG4gICAgTm9kZTogRGVmYXVsdE5vZGUsXG4gICAgVmlld0xheWVyOiBEb21WaWV3TGF5ZXIsXG4gICAgbm9TZWxlY3RSb290OiBmYWxzZSxcbiAgICBhbmltYXRlOiB0cnVlXG4gIH0sIG9wdGlvbnMpXG4gIHRoaXMuby5rZXliaW5kaW5ncyA9IHV0aWwubWVyZ2UodGhpcy5kZWZhdWx0X2tleXMsIG9wdGlvbnMua2V5cylcbiAgdGhpcy52bCA9IG5ldyB0aGlzLm8uVmlld0xheWVyKHRoaXMubylcbiAgdGhpcy5iaW5kQWN0aW9ucyA9IGJpbmRBY3Rpb25zXG4gIHRoaXMubW9kZWwgPSBtb2RlbFxuICB0aGlzLmN0cmwgPSBjdHJsXG4gIC8vIGFjdHVhbGx5IERyYWdBbmREcm9wXG4gIHRoaXMuZG5kID0gbmV3IER1bmdlb25zQW5kRHJhZ29ucyh0aGlzLnZsLCBjdHJsLmFjdGlvbnMubW92ZS5iaW5kKGN0cmwpKVxuICB0aGlzLmxhenlfY2hpbGRyZW4gPSB7fVxuXG4gIHRoaXMubmV3Tm9kZSA9IG51bGxcbiAgdGhpcy5hdHRhY2hMaXN0ZW5lcnMoKVxufVxuXG5WaWV3LnByb3RvdHlwZSA9IHtcbiAgZ2V0Tm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZsLnJvb3RcbiAgfSxcblxuICByZWJhc2U6IGZ1bmN0aW9uIChuZXdyb290LCB0cmlnZ2VyKSB7XG4gICAgdGhpcy52bC5jbGVhcigpXG4gICAgdmFyIHJvb3QgPSB0aGlzLnZsLnJvb3RcbiAgICB0aGlzLmluaXRpYWxpemUobmV3cm9vdClcbiAgICB0aGlzLnZsLnJlYmFzZShyb290KVxuICAgIHRoaXMuY3RybC50cmlnZ2VyKCdyZWJhc2UnLCBuZXdyb290KVxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmlkc1tyb290XVxuICAgICAgLCByb290Tm9kZSA9IHRoaXMudmwubWFrZVJvb3Qobm9kZSwgdGhpcy5iaW5kQWN0aW9ucyhyb290KSlcbiAgICB0aGlzLmFjdGl2ZSA9IG51bGxcbiAgICB0aGlzLnNlbGVjdGlvbiA9IG51bGxcbiAgICB0aGlzLmxhenlfY2hpbGRyZW4gPSB7fVxuICAgIHRoaXMucm9vdCA9IHJvb3RcbiAgICB0aGlzLnBvcHVsYXRlQ2hpbGRyZW4ocm9vdClcbiAgICBpZiAoIW5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICB0aGlzLmFkZE5ldyh0aGlzLnJvb3QsIDApXG4gICAgfVxuICAgIHRoaXMuc2VsZWN0U29tZXRoaW5nKClcbiAgICByZXR1cm4gcm9vdE5vZGVcbiAgfSxcblxuICBzdGFydE1vdmluZzogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHRhcmdldHMgPSB0aGlzLnZsLmRyb3BUYXJnZXRzKHRoaXMucm9vdCwgdGhpcy5tb2RlbCwgaWQsIHRydWUpXG4gICAgdGhpcy5kbmQuc3RhcnRNb3ZpbmcodGFyZ2V0cywgaWQpXG4gIH0sXG5cbiAgYWRkTmV3OiBmdW5jdGlvbiAocGlkLCBpbmRleCkge1xuICAgIHRoaXMubmV3Tm9kZSA9IHtcbiAgICAgIHBpZDogcGlkLFxuICAgICAgaW5kZXg6IGluZGV4XG4gICAgfVxuICAgIHZhciBiZWZvcmUgPSB0aGlzLm1vZGVsLmdldEJlZm9yZShwaWQsIGluZGV4LTEpXG4gICAgdGhpcy52bC5hZGROZXcoe1xuICAgICAgaWQ6ICduZXcnLFxuICAgICAgY29udGVudDogJycsXG4gICAgICBtZXRhOiB7fSxcbiAgICAgIHBhcmVudDogcGlkXG4gICAgfSwgdGhpcy5iaW5kQWN0aW9ucygnbmV3JyksIGJlZm9yZSlcbiAgfSxcblxuICByZW1vdmVOZXc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMubmV3Tm9kZSkgcmV0dXJuIGZhbHNlXG4gICAgdmFyIG53ID0gdGhpcy5uZXdOb2RlXG4gICAgICAsIGxhc3RjaGlsZCA9ICF0aGlzLm1vZGVsLmlkc1tudy5waWRdLmNoaWxkcmVuLmxlbmd0aFxuICAgIHRoaXMudmwucmVtb3ZlKCduZXcnLCBudy5waWQsIGxhc3RjaGlsZClcbiAgICB0aGlzLm5ld05vZGUgPSBudWxsXG4gICAgcmV0dXJuIG53XG4gIH0sXG5cbiAgc2VsZWN0U29tZXRoaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkXG4gICAgaWYgKCF0aGlzLm1vZGVsLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgY2hpbGQgPSAnbmV3J1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZCA9IHRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY2hpbGRyZW5bMF1cbiAgICB9XG4gICAgdGhpcy5nb1RvKGNoaWxkKVxuICB9LFxuXG4gIHBvcHVsYXRlQ2hpbGRyZW46IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5pZHNbaWRdXG4gICAgaWYgKG5vZGUuY29sbGFwc2VkICYmIGlkICE9PSB0aGlzLnJvb3QpIHtcbiAgICAgIHRoaXMubGF6eV9jaGlsZHJlbltpZF0gPSB0cnVlXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5sYXp5X2NoaWxkcmVuW2lkXSA9IGZhbHNlXG4gICAgaWYgKCFub2RlLmNoaWxkcmVuIHx8ICFub2RlLmNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuXG4gICAgZm9yICh2YXIgaT0wOyBpPG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYWRkKHRoaXMubW9kZWwuaWRzW25vZGUuY2hpbGRyZW5baV1dLCBmYWxzZSwgdHJ1ZSlcbiAgICAgIHRoaXMucG9wdWxhdGVDaGlsZHJlbihub2RlLmNoaWxkcmVuW2ldKVxuICAgIH1cbiAgfSxcblxuICBnb1RvOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAnaW5zZXJ0Jykge1xuICAgICAgdGhpcy5zdGFydEVkaXRpbmcoaWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0QWN0aXZlKGlkKVxuICAgIH1cbiAgfSxcblxuICBkZWZhdWx0X2tleXM6IHtcbiAgICAnY3V0JzogJ2N0cmwreCwgZGVsZXRlLCBkIGQnLFxuICAgICdjb3B5JzogJ2N0cmwrYywgeSB5JyxcbiAgICAncGFzdGUnOiAncCwgY3RybCt2JyxcbiAgICAncGFzdGUgYWJvdmUnOiAnc2hpZnQrcCwgY3RybCtzaGlmdCt2JyxcbiAgICAndmlzdWFsIG1vZGUnOiAndiwgc2hpZnQrdicsXG5cbiAgICAnY2hhbmdlJzogJ2MgYywgc2hpZnQrYycsXG4gICAgJ2VkaXQnOiAncmV0dXJuLCBhLCBzaGlmdCthLCBmMicsXG4gICAgJ2VkaXQgc3RhcnQnOiAnaSwgc2hpZnQraScsXG4gICAgJ2ZpcnN0IHNpYmxpbmcnOiAnc2hpZnQrWycsXG4gICAgJ2xhc3Qgc2libGluZyc6ICdzaGlmdCtdJyxcbiAgICAnbW92ZSB0byBmaXJzdCBzaWJsaW5nJzogJ3NoaWZ0K2FsdCtbJyxcbiAgICAnbW92ZSB0byBsYXN0IHNpYmxpbmcnOiAnc2hpZnQrYWx0K10nLFxuICAgICduZXcgYWZ0ZXInOiAnbycsXG4gICAgJ25ldyBiZWZvcmUnOiAnc2hpZnQrbycsXG4gICAgJ2p1bXAgdG8gdG9wJzogJ2cgZycsXG4gICAgJ2p1bXAgdG8gYm90dG9tJzogJ3NoaWZ0K2cnLFxuICAgICd1cCc6ICd1cCwgaycsXG4gICAgJ2Rvd24nOiAnZG93biwgaicsXG4gICAgJ2xlZnQnOiAnbGVmdCwgaCcsXG4gICAgJ3JpZ2h0JzogJ3JpZ2h0LCBsJyxcbiAgICAnbmV4dCBzaWJsaW5nJzogJ2FsdCtqLCBhbHQrZG93bicsXG4gICAgJ3ByZXYgc2libGluZyc6ICdhbHQraywgYWx0K3VwJyxcbiAgICAndG9nZ2xlIGNvbGxhcHNlJzogJ3onLFxuICAgICdjb2xsYXBzZSc6ICdhbHQraCwgYWx0K2xlZnQnLFxuICAgICd1bmNvbGxhcHNlJzogJ2FsdCtsLCBhbHQrcmlnaHQnLFxuICAgICdpbmRlbnQnOiAndGFiLCBzaGlmdCthbHQrbCwgc2hpZnQrYWx0K3JpZ2h0JyxcbiAgICAnZGVkZW50JzogJ3NoaWZ0K3RhYiwgc2hpZnQrYWx0K2gsIHNoaWZ0K2FsdCtsZWZ0JyxcbiAgICAnbW92ZSBkb3duJzogJ3NoaWZ0K2FsdCtqLCBzaGlmdCthbHQrZG93bicsXG4gICAgJ21vdmUgdXAnOiAnc2hpZnQrYWx0K2ssIHNoaWZ0K2FsdCtpLCBzaGlmdCthbHQrdXAnLFxuICAgICd1bmRvJzogJ2N0cmwreiwgdScsXG4gICAgJ3JlZG8nOiAnY3RybCtzaGlmdCt6LCBzaGlmdCtyJyxcbiAgfSxcblxuICBhY3Rpb25zOiB7XG4gICAgJ2N1dCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy5jdXQodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdjb3B5JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSByZXR1cm5cbiAgICAgIHRoaXMuY3RybC5hY3Rpb25zLmNvcHkodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdwYXN0ZSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy5wYXN0ZSh0aGlzLmFjdGl2ZSlcbiAgICB9LFxuXG4gICAgJ3Bhc3RlIGFib3ZlJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSByZXR1cm5cbiAgICAgIHRoaXMuY3RybC5hY3Rpb25zLnBhc3RlKHRoaXMuYWN0aXZlLCB0cnVlKVxuICAgIH0sXG5cbiAgICAndmlzdWFsIG1vZGUnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHRoaXMucm9vdCkgcmV0dXJuXG4gICAgICB0aGlzLnNldFNlbGVjdGlvbihbdGhpcy5hY3RpdmVdKVxuICAgIH0sXG5cbiAgICAndW5kbyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY3RybC51bmRvKCk7XG4gICAgfSxcblxuICAgICdyZWRvJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jdHJsLnJlZG8oKTtcbiAgICB9LFxuXG4gICAgJ2NoYW5nZSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmFjdGl2ZSA9PT0gdGhpcy5yb290XG4gICAgICB9XG4gICAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnNldENvbnRlbnQoJycpXG4gICAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnN0YXJ0RWRpdGluZygpXG4gICAgfSxcblxuICAgICdlZGl0JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdGhpcy5yb290XG4gICAgICB9XG4gICAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnN0YXJ0RWRpdGluZygpXG4gICAgfSxcblxuICAgICdlZGl0IHN0YXJ0JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdGhpcy5yb290XG4gICAgICB9XG4gICAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnN0YXJ0RWRpdGluZyh0cnVlKVxuICAgIH0sXG5cbiAgICAvLyBuYXZcbiAgICAnZmlyc3Qgc2libGluZyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIHZhciBmaXJzdCA9IHRoaXMubW9kZWwuZmlyc3RTaWJsaW5nKHRoaXMuYWN0aXZlKVxuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gZmlyc3QpIHJldHVyblxuICAgICAgdGhpcy5zZXRBY3RpdmUoZmlyc3QpXG4gICAgfSxcblxuICAgICdsYXN0IHNpYmxpbmcnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gJ25ldycpIHJldHVybiB0aGlzLnNldEFjdGl2ZSh0aGlzLnJvb3QpXG4gICAgICB2YXIgbGFzdCA9IHRoaXMubW9kZWwubGFzdFNpYmxpbmcodGhpcy5hY3RpdmUpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBsYXN0KSByZXR1cm5cbiAgICAgIHRoaXMuc2V0QWN0aXZlKGxhc3QpXG4gICAgfSxcblxuICAgICdqdW1wIHRvIHRvcCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICB9LFxuXG4gICAgJ2p1bXAgdG8gYm90dG9tJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRBY3RpdmUodGhpcy5tb2RlbC5sYXN0T3Blbih0aGlzLnJvb3QpKVxuICAgICAgY29uc29sZS5sb2coJ2JvdHRvbScpXG4gICAgICAvLyBwYXNzXG4gICAgfSxcblxuICAgICd1cCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLnNldEFjdGl2ZSh0aGlzLnJvb3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09ICduZXcnKSByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgICB2YXIgdG9wID0gdGhpcy5hY3RpdmVcbiAgICAgICAgICAsIGFib3ZlID0gdGhpcy5tb2RlbC5pZEFib3ZlKHRvcClcbiAgICAgICAgaWYgKGFib3ZlID09PSB1bmRlZmluZWQpIGFib3ZlID0gdG9wXG4gICAgICAgIGlmIChhYm92ZSA9PT0gdGhpcy5yb290ICYmIHRoaXMuby5ub1NlbGVjdFJvb3QpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEFjdGl2ZShhYm92ZSlcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgJ2Rvd24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gdGhpcy5yb290ICYmXG4gICAgICAgICAgICAhdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUoJ25ldycpXG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRvcCA9IHRoaXMuYWN0aXZlXG4gICAgICAgICAgLCBhYm92ZSA9IHRoaXMubW9kZWwuaWRCZWxvdyh0b3AsIHRoaXMucm9vdClcbiAgICAgICAgaWYgKGFib3ZlID09PSB1bmRlZmluZWQpIGFib3ZlID0gdG9wXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKGFib3ZlKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAnbGVmdCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIHZhciBsZWZ0ID0gdGhpcy5tb2RlbC5nZXRQYXJlbnQodGhpcy5hY3RpdmUpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBsZWZ0KSByZXR1cm5cbiAgICAgIHRoaXMuc2V0QWN0aXZlKGxlZnQpXG4gICAgfSxcblxuICAgICdyaWdodCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuXG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHRoaXMucm9vdCAmJlxuICAgICAgICAgICF0aGlzLm1vZGVsLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUoJ25ldycpXG4gICAgICB9XG4gICAgICB2YXIgcmlnaHQgPSB0aGlzLm1vZGVsLmdldENoaWxkKHRoaXMuYWN0aXZlKVxuICAgICAgaWYgKHRoaXMubW9kZWwuaXNDb2xsYXBzZWQodGhpcy5hY3RpdmUpKSByZXR1cm5cbiAgICAgIGlmICh1bmRlZmluZWQgPT09IHJpZ2h0KSByZXR1cm5cbiAgICAgIHRoaXMuc2V0QWN0aXZlKHJpZ2h0KVxuICAgIH0sXG5cbiAgICAnbmV4dCBzaWJsaW5nJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldEFjdGl2ZSh0aGlzLnJvb3QpXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIHZhciBzaWIgPSB0aGlzLm1vZGVsLm5leHRTaWJsaW5nKHRoaXMuYWN0aXZlKVxuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gc2liKSByZXR1cm5cbiAgICAgIHRoaXMuc2V0QWN0aXZlKHNpYilcbiAgICB9LFxuXG4gICAgJ3ByZXYgc2libGluZyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIHZhciBzaWIgPSB0aGlzLm1vZGVsLnByZXZTaWJsaW5nKHRoaXMuYWN0aXZlKVxuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gc2liKSByZXR1cm5cbiAgICAgIHRoaXMuc2V0QWN0aXZlKHNpYilcbiAgICB9LFxuXG4gICAgJ21vdmUgdG8gZmlyc3Qgc2libGluZyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy5tb3ZlVG9Ub3AodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdtb3ZlIHRvIGxhc3Qgc2libGluZyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy5tb3ZlVG9Cb3R0b20odGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICduZXcgYmVmb3JlJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSByZXR1cm5cbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gJ25ldycpIHJldHVybiB0aGlzLnN0YXJ0RWRpdGluZygpXG4gICAgICB0aGlzLmN0cmwuYWRkQmVmb3JlKHRoaXMuYWN0aXZlLCAnJywgdHJ1ZSlcbiAgICB9LFxuXG4gICAgJ25ldyBhZnRlcic6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09ICduZXcnKSByZXR1cm4gdGhpcy5zdGFydEVkaXRpbmcoKVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMuYWRkQWZ0ZXIodGhpcy5hY3RpdmUsICcnLCB0cnVlKVxuICAgIH0sXG5cbiAgICAvLyBtb3ZleiFcbiAgICAndG9nZ2xlIGNvbGxhcHNlJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMudG9nZ2xlQ29sbGFwc2UodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdjb2xsYXBzZSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMudG9nZ2xlQ29sbGFwc2UodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgfSxcblxuICAgICd1bmNvbGxhcHNlJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldEFjdGl2ZSh0aGlzLnJvb3QpXG4gICAgICB9XG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy50b2dnbGVDb2xsYXBzZSh0aGlzLmFjdGl2ZSwgZmFsc2UpXG4gICAgfSxcblxuICAgICdpbmRlbnQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIH1cbiAgICAgIHRoaXMuY3RybC5hY3Rpb25zLm1vdmVSaWdodCh0aGlzLmFjdGl2ZSlcbiAgICB9LFxuXG4gICAgJ2RlZGVudCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMubW92ZUxlZnQodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdtb3ZlIGRvd24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIH1cbiAgICAgIHRoaXMuY3RybC5hY3Rpb25zLm1vdmVEb3duKHRoaXMuYWN0aXZlKVxuICAgIH0sXG5cbiAgICAnbW92ZSB1cCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMubW92ZVVwKHRoaXMuYWN0aXZlKVxuICAgIH1cblxuICB9LFxuXG4gIHZpc3VhbDoge1xuICAgIC8vIG1vdmVtZW50XG4gICAgJ2ssIHVwJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHByZXYgPSB0aGlzLm1vZGVsLnByZXZTaWJsaW5nKHRoaXMuYWN0aXZlLCB0cnVlKVxuICAgICAgaWYgKCFwcmV2KSByZXR1cm5cbiAgICAgIHRoaXMuYWRkVG9TZWxlY3Rpb24ocHJldiwgdHJ1ZSlcbiAgICB9LFxuXG4gICAgJ2osIGRvd24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMubW9kZWwubmV4dFNpYmxpbmcodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgICBpZiAoIW5leHQpIHJldHVyblxuICAgICAgdGhpcy5hZGRUb1NlbGVjdGlvbihuZXh0LCBmYWxzZSlcbiAgICB9LFxuXG4gICAgJ3NoaWZ0K2cnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbiA9IHRoaXMubW9kZWwuaWRzW3RoaXMuc2VsZWN0aW9uWzBdXVxuICAgICAgICAsIGNoID0gdGhpcy5tb2RlbC5pZHNbbi5wYXJlbnRdLmNoaWxkcmVuXG4gICAgICAgICwgaXggPSBjaC5pbmRleE9mKHRoaXMuc2VsZWN0aW9uWzBdKVxuICAgICAgdGhpcy5zZXRTZWxlY3Rpb24oY2guc2xpY2UoaXgpKVxuICAgICAgdGhpcy5zZWxfaW52ZXJ0ZWQgPSBmYWxzZVxuICAgICAgdGhpcy5zZXRBY3RpdmUoY2hbY2gubGVuZ3RoLTFdKVxuICAgIH0sXG5cbiAgICAnZyBnJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG4gPSB0aGlzLm1vZGVsLmlkc1t0aGlzLnNlbGVjdGlvblswXV1cbiAgICAgICAgLCBjaCA9IHRoaXMubW9kZWwuaWRzW24ucGFyZW50XS5jaGlsZHJlblxuICAgICAgICAsIGl4ID0gY2guaW5kZXhPZih0aGlzLnNlbGVjdGlvblswXSlcbiAgICAgICAgLCBpdGVtcyA9IFtdXG4gICAgICBmb3IgKHZhciBpPTA7IGk8PWl4OyBpKyspIHtcbiAgICAgICAgaXRlbXMudW5zaGlmdChjaFtpXSlcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0U2VsZWN0aW9uKGl0ZW1zKVxuICAgICAgdGhpcy5zZWxfaW52ZXJ0ZWQgPSBpdGVtcy5sZW5ndGggPiAxXG4gICAgICB0aGlzLnNldEFjdGl2ZShjaFswXSlcbiAgICB9LFxuXG4gICAgJ3YsIHNoaWZ0K3YsIGVzY2FwZSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gICAgfSxcblxuICAgICdpLCBhLCBzaGlmdCthJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdGFydEVkaXRpbmcodGhpcy5hY3RpdmUpXG4gICAgfSxcblxuICAgICdzaGlmdCtpJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdGFydEVkaXRpbmcodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgfSxcblxuICAgIC8vIGVkaXRuZXNzXG4gICAgJ2QsIHNoaWZ0K2QsIGN0cmwreCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRoaXMuc2VsZWN0aW9uLnNsaWNlKClcbiAgICAgIGlmICh0aGlzLnNlbF9pbnZlcnRlZCkge1xuICAgICAgICBpdGVtcyA9IHJldmVyc2VkKGl0ZW1zKVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMuY3V0KGl0ZW1zKVxuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICB9LFxuXG4gICAgJ3ksIHNoaWZ0K3ksIGN0cmwrYyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRoaXMuc2VsZWN0aW9uLnNsaWNlKClcbiAgICAgIGlmICh0aGlzLnNlbF9pbnZlcnRlZCkge1xuICAgICAgICBpdGVtcyA9IHJldmVyc2VkKGl0ZW1zKVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMuY29weShpdGVtcylcbiAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gICAgfSxcblxuICAgICd1LCBjdHJsK3onOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3BTZWxlY3RpbmcoKVxuICAgICAgdGhpcy5jdHJsLnVuZG8oKVxuICAgIH0sXG5cbiAgICAnc2hpZnQrciwgY3RybCtzaGlmdCt6JzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICAgIHRoaXMuY3RybC5yZWRvKClcbiAgICB9LFxuXG4gIH0sXG5cbiAgZXh0cmFfYWN0aW9uczoge30sXG5cbiAga2V5SGFuZGxlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub3JtYWwgPSB7fVxuICAgICAgLCBhY3Rpb25cbiAgICBmb3IgKGFjdGlvbiBpbiB0aGlzLm8ua2V5YmluZGluZ3MpIHtcbiAgICAgIGlmICghdGhpcy5hY3Rpb25zW2FjdGlvbl0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbmZpZ3VyYXRpb24hIFVua25vd24gYWN0aW9uOiAnICsgYWN0aW9uKVxuICAgICAgfVxuICAgICAgbm9ybWFsW3RoaXMuby5rZXliaW5kaW5nc1thY3Rpb25dXSA9IHRoaXMuYWN0aW9uc1thY3Rpb25dXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZXh0cmFfYWN0aW9ucykge1xuICAgICAgZm9yIChhY3Rpb24gaW4gdGhpcy5leHRyYV9hY3Rpb25zKSB7XG4gICAgICAgIGlmICghbm9ybWFsW2FjdGlvbl0pIHtcbiAgICAgICAgICBub3JtYWxbdGhpcy5leHRyYV9hY3Rpb25zW2FjdGlvbl0uYmluZGluZ10gPSB0aGlzLmV4dHJhX2FjdGlvbnNbYWN0aW9uXS5hY3Rpb25cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBoYW5kbGVycyA9IHtcbiAgICAgICdpbnNlcnQnOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICdub3JtYWwnOiBrZXlzKG5vcm1hbCksXG4gICAgICAndmlzdWFsJzoga2V5cyh0aGlzLnZpc3VhbClcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGhhbmRsZXJzW3RoaXMubW9kZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0uYmluZCh0aGlzKVxuICB9LFxuXG4gIGF0dGFjaExpc3RlbmVyczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBrZXlkb3duID0gdGhpcy5rZXlIYW5kbGVyKClcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZS50YXJnZXQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHJldHVyblxuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHJldHVyblxuICAgICAga2V5ZG93bi5jYWxsKHRoaXMsIGUpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIGFkZFRyZWU6IGZ1bmN0aW9uIChub2RlLCBiZWZvcmUpIHtcbiAgICBpZiAoIXRoaXMudmwuYm9keShub2RlLnBhcmVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShub2RlLnBhcmVudCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy5hZGQobm9kZSwgYmVmb3JlKVxuICAgIGlmICghbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHJldHVyblxuICAgIGZvciAodmFyIGk9MDsgaTxub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmFkZFRyZWUodGhpcy5tb2RlbC5pZHNbbm9kZS5jaGlsZHJlbltpXV0sIGZhbHNlKVxuICAgIH1cbiAgfSxcblxuICAvLyBvcGVyYXRpb25zXG4gIGFkZDogZnVuY3Rpb24gKG5vZGUsIGJlZm9yZSwgZG9udGZvY3VzKSB7XG4gICAgdmFyIGVkID0gdGhpcy5tb2RlID09PSAnaW5zZXJ0J1xuICAgICAgLCBjaGlsZHJlbiA9ICEhbm9kZS5jaGlsZHJlbi5sZW5ndGhcbiAgICBpZiAoIXRoaXMudmwuYm9keShub2RlLnBhcmVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShub2RlLnBhcmVudCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy52bC5hZGROZXcobm9kZSwgdGhpcy5iaW5kQWN0aW9ucyhub2RlLmlkKSwgYmVmb3JlLCBjaGlsZHJlbilcbiAgICBpZiAoIWRvbnRmb2N1cykge1xuICAgICAgaWYgKGVkKSB7XG4gICAgICAgIHRoaXMudmwuYm9keShub2RlLmlkKS5zdGFydEVkaXRpbmcoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUobm9kZS5pZClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoaWQsIGlnbm9yZUFjdGl2ZSkge1xuICAgIHZhciBwaWQgPSB0aGlzLm1vZGVsLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudCA9IHRoaXMubW9kZWwuaWRzW3BpZF1cbiAgICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShwaWQsIHRydWUpXG4gICAgfVxuICAgIGlmIChpZCA9PT0gdGhpcy5hY3RpdmUgJiYgIWlnbm9yZUFjdGl2ZSkge1xuICAgICAgdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgIH1cbiAgICB0aGlzLnZsLnJlbW92ZShpZCwgcGlkLCBwYXJlbnQgJiYgcGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSlcbiAgICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBwaWQgPT09IHRoaXMucm9vdCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmFkZE5ldyhwaWQsIDApXG4gICAgICB9LmJpbmQodGhpcyksMClcbiAgICB9XG4gIH0sXG5cbiAgc2V0Q29udGVudDogZnVuY3Rpb24gKGlkLCBjb250ZW50KSB7XG4gICAgaWYgKCF0aGlzLnZsLmJvZHkoaWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWJhc2UoaWQsIHRydWUpXG4gICAgfVxuICAgIHRoaXMudmwuYm9keShpZCkuc2V0Q29udGVudChjb250ZW50KVxuICAgIGlmICh0aGlzLm1vZGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICB0aGlzLnZsLmJvZHkoaWQpLnN0YXJ0RWRpdGluZygpXG4gICAgfVxuICB9LFxuXG4gIHNldEF0dHI6IGZ1bmN0aW9uIChpZCwgYXR0ciwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShpZCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy52bC5ib2R5KGlkKS5zZXRBdHRyKGF0dHIsIHZhbHVlKVxuICAgIGlmICh0aGlzLm1vZGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICB0aGlzLnZsLmJvZHkoaWQpLnN0YXJ0RWRpdGluZygpXG4gICAgfVxuICB9LFxuXG4gIHJlcGxhY2VNZXRhOiBmdW5jdGlvbiAoaWQsIG1ldGEpIHtcbiAgICB0aGlzLnZsLmJvZHkoaWQpLnJlcGxhY2VNZXRhKG1ldGEpXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgIHRoaXMudmwuYm9keShpZCkuc3RhcnRFZGl0aW5nKClcbiAgICB9XG4gIH0sXG5cbiAgYXBwZW5kVGV4dDogZnVuY3Rpb24gKGlkLCB0ZXh0KSB7XG4gICAgdGhpcy52bC5ib2R5KGlkKS5hZGRFZGl0VGV4dCh0ZXh0KVxuICB9LFxuXG4gIG1vdmU6IGZ1bmN0aW9uIChpZCwgcGlkLCBiZWZvcmUsIHBwaWQsIGxhc3RjaGlsZCkge1xuICAgIGlmICghdGhpcy52bC5ib2R5KGlkKSkge1xuICAgICAgcmV0dXJuIHRoaXMucmViYXNlKHRoaXMubW9kZWwuY29tbW9uUGFyZW50KHBpZCwgcHBpZCksIHRydWUpXG4gICAgfVxuICAgIHZhciBlZCA9IHRoaXMubW9kZSA9PT0gJ2luc2VydCdcbiAgICB0aGlzLnZsLm1vdmUoaWQsIHBpZCwgYmVmb3JlLCBwcGlkLCBsYXN0Y2hpbGQpXG4gICAgaWYgKGVkKSB0aGlzLnN0YXJ0RWRpdGluZyhpZClcbiAgfSxcblxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uIChpZCwgZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlkID0gdGhpcy5hY3RpdmUgIT09IG51bGwgPyB0aGlzLmFjdGl2ZSA6IHRoaXMucm9vdFxuICAgIH1cbiAgICBpZiAoaWQgPT09IHRoaXMucm9vdCAmJiB0aGlzLm8ubm9TZWxlY3RSb290KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIGJvZHkgPSB0aGlzLnZsLmJvZHkoaWQpXG4gICAgaWYgKCFib2R5KSByZXR1cm5cbiAgICBib2R5LnN0YXJ0RWRpdGluZyhmcm9tU3RhcnQpXG4gIH0sXG5cbiAgc3RvcEVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5tb2RlICE9PSAnaW5zZXJ0JykgcmV0dXJuXG4gICAgaWYgKHRoaXMuYWN0aXZlID09PSBudWxsKSByZXR1cm5cbiAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnN0b3BFZGl0aW5nKClcbiAgfSxcblxuICBzZXRFZGl0aW5nOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSAndmlzdWFsJykge1xuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICB9XG4gICAgdGhpcy5tb2RlID0gJ2luc2VydCdcbiAgICB0aGlzLnNldEFjdGl2ZShpZClcbiAgfSxcblxuICBkb25lRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubW9kZSA9ICdub3JtYWwnXG4gIH0sXG5cbiAgc2V0QWN0aXZlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoaWQgPT09IHRoaXMuYWN0aXZlKSByZXR1cm4gdGhpcy52bC5zaG93QWN0aXZlKGlkKVxuICAgIGlmICh0aGlzLmFjdGl2ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy52bC5jbGVhckFjdGl2ZSh0aGlzLmFjdGl2ZSlcbiAgICB9XG4gICAgaWYgKCF0aGlzLnZsLmRvbVtpZF0pIHtcbiAgICAgIGlkID0gdGhpcy5yb290XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlID0gaWRcbiAgICB0aGlzLnZsLnNob3dBY3RpdmUoaWQpXG4gIH0sXG5cbiAgZ2V0QWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnZsLmRvbVt0aGlzLmFjdGl2ZV0pIHtcbiAgICAgIHJldHVybiB0aGlzLnJvb3RcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlXG4gIH0sXG5cbiAgYWRkVG9TZWxlY3Rpb246IGZ1bmN0aW9uIChpZCwgaW52ZXJ0KSB7XG4gICAgdmFyIGl4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihpZClcbiAgICBpZiAoaXggPT09IC0xKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbi5wdXNoKGlkKVxuICAgICAgdGhpcy52bC5zaG93U2VsZWN0aW9uKFtpZF0pXG4gICAgICB0aGlzLnNlbF9pbnZlcnRlZCA9IGludmVydFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnZsLmNsZWFyU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uLnNsaWNlKGl4ICsgMSkpXG4gICAgICB0aGlzLnNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uLnNsaWNlKDAsIGl4ICsgMSlcbiAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhpcy5zZWxfaW52ZXJ0ZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNldEFjdGl2ZShpZClcbiAgICBjb25zb2xlLmxvZyh0aGlzLnNlbF9pbnZlcnRlZClcbiAgfSxcblxuICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uIChzZWwpIHtcbiAgICB0aGlzLm1vZGUgPSAndmlzdWFsJ1xuICAgIHRoaXMuc2VsX2ludmVydGVkID0gZmFsc2VcbiAgICBpZiAodGhpcy5zZWxlY3Rpb24pIHtcbiAgICAgIHRoaXMudmwuY2xlYXJTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24pXG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsXG4gICAgdGhpcy52bC5zaG93U2VsZWN0aW9uKHNlbClcbiAgfSxcblxuICBzdG9wU2VsZWN0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZsLmNsZWFyU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKVxuICAgICAgdGhpcy5zZWxlY3Rpb24gPSBudWxsXG4gICAgfVxuICAgIHRoaXMubW9kZSA9ICdub3JtYWwnXG4gIH0sXG5cbiAgc2V0Q29sbGFwc2VkOiBmdW5jdGlvbiAoaWQsIHdoYXQpIHtcbiAgICAvKlxuICAgIGlmICghdGhpcy52bC5ib2R5KGlkKSkge1xuICAgICAgcmV0dXJuIHRoaXMucmViYXNlKHRoaXMubW9kZWwuaWRzW2lkXS5wYXJlbnQpXG4gICAgfVxuICAgICovXG4gICAgaWYgKHdoYXQpIHtcbiAgICAgIGlmICh0aGlzLm1vZGUgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgIHRoaXMuc3RhcnRFZGl0aW5nKGlkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmUoaWQpXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vLmFuaW1hdGUpIHtcbiAgICAgICAgdGhpcy52bC5hbmltYXRlQ2xvc2VkKGlkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52bC5zZXRDb2xsYXBzZWQoaWQsIHRydWUpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmxhenlfY2hpbGRyZW5baWRdKSB7XG4gICAgICAgIHRoaXMucG9wdWxhdGVDaGlsZHJlbihpZClcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm8uYW5pbWF0ZSkge1xuICAgICAgICB0aGlzLnZsLmFuaW1hdGVPcGVuKGlkKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52bC5zZXRDb2xsYXBzZWQoaWQsIGZhbHNlKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBUT0RPOiBldmVudCBsaXN0ZW5lcnM/XG4gIH0sXG5cbiAgLy8gbm9uLW1vZGlmeWluZyBzdHVmZlxuICBnb1VwOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAvLyBzaG91bGQgSSBjaGVjayB0byBzZWUgaWYgaXQncyBvaz9cbiAgICB2YXIgYWJvdmUgPSB0aGlzLm1vZGVsLmlkQWJvdmUoaWQpXG4gICAgaWYgKGFib3ZlID09PSBmYWxzZSkgcmV0dXJuXG4gICAgaWYgKGFib3ZlID09PSB0aGlzLnJvb3QgJiYgdGhpcy5vLm5vU2VsZWN0Um9vdCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMudmwuYm9keShhYm92ZSkuYm9keS5zdGFydEVkaXRpbmcoKTtcbiAgfSxcblxuICBnb0Rvd246IGZ1bmN0aW9uIChpZCwgZnJvbVN0YXJ0KSB7XG4gICAgdmFyIGJlbG93ID0gdGhpcy5tb2RlbC5pZEJlbG93KGlkLCB0aGlzLnJvb3QpXG4gICAgaWYgKGJlbG93ID09PSBmYWxzZSkgcmV0dXJuXG4gICAgdGhpcy52bC5ib2R5KGJlbG93KS5ib2R5LnN0YXJ0RWRpdGluZyhmcm9tU3RhcnQpXG4gIH0sXG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja1xuXG5mdW5jdGlvbiB1bkVzY2FwZUh0bWwoc3RyKSB7XG4gIGlmICghc3RyKSByZXR1cm4gJyc7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvPGRpdj4vZywgJ1xcbicpLnJlcGxhY2UoLzxicj4vZywgJ1xcbicpXG4gICAgLnJlcGxhY2UoLzxcXC9kaXY+L2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHUyMDBiL2csICcnKVxufVxuXG4vKipcbiAqIENvbmZpZyBsb29rcyBsaWtlOlxuICoge1xuICogICB0b3A6IG51bSxcbiAqICAgbGVmdDogbnVtLCAoZnJvbSBtZXRhLndoaXRlYm9hcmQpXG4gKiAgfVxuICogT3B0aW9ucyBsb29rcyBsaWtlOlxuICoge1xuICogIHNhdmVDb25maWdcbiAqICBzYXZlQ29udGVudFxuICogIGNoYW5nZUNvbnRlbnRcbiAqICBzdGFydE1vdmluZyhldmVudCwgcmVjdCwgP3NoaWZ0TW92ZSlcbiAqICBzdGFydE1vdmluZ0NoaWxkKGV2ZW50LCBpZCwgP3NoaWZ0TW92ZSlcbiAqICBvblpvb21cbiAqIH1cbiAqL1xuZnVuY3Rpb24gQmxvY2soZGF0YSwgY2hpbGRyZW4sIGNvbmZpZywgb3B0aW9ucykge1xuICB0aGlzLm8gPSBvcHRpb25zXG4gIHRoaXMuZWRpdGluZyA9IGZhbHNlXG4gIHRoaXMuX21vdmVkID0gZmFsc2VcbiAgdGhpcy5zZXR1cE5vZGUoZGF0YSwgY2hpbGRyZW4pXG4gIHRoaXMucmVwb3NpdGlvbihjb25maWcubGVmdCwgY29uZmlnLnRvcCwgdHJ1ZSlcbiAgLy8gdGhpcy5yZXNpemUoY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0LCB0cnVlKVxufVxuXG5CbG9jay5wcm90b3R5cGUgPSB7XG4gIHNldHVwTm9kZTogZnVuY3Rpb24gKGRhdGEsIGNoaWxkcmVuKSB7XG4gICAgdGhpcy5ub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLm5vZGUuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmQtaXRlbSdcbiAgICAvLyB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24uYmluZCh0aGlzKSlcbiAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uTW91c2VVcC5iaW5kKHRoaXMpKVxuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpKVxuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bi5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy50aXRsZS5jbGFzc05hbWU9J3doaXRlYm9hcmQtaXRlbV90aXRsZSdcbiAgICAvLyB0aGlzLnRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGljay5iaW5kKHRoaXMpKVxuICAgIHRoaXMudGl0bGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpXG4gICAgdGhpcy50aXRsZS5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuby5vblpvb20pXG5cbiAgICB0aGlzLmlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmlucHV0LnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgdHJ1ZSlcbiAgICB0aGlzLmlucHV0LmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWl0ZW1faW5wdXQnXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fb25CbHVyLmJpbmQodGhpcykpXG5cbiAgICB0aGlzLmJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpXG4gICAgdGhpcy5ib2R5LmNsYXNzTmFtZT0nd2hpdGVib2FyZC1pdGVtX2JvZHknXG5cbiAgICB2YXIgem9vbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgem9vbS5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1pdGVtX3pvb20nXG4gICAgem9vbS5pbm5lckhUTUwgPSAnPGkgY2xhc3M9XCJmYSBmYS1leHBhbmRcIi8+J1xuICAgIHpvb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm8ub25ab29tKVxuXG4gICAgdGhpcy5jaGlsZHJlbiA9IHt9XG5cbiAgICBjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZUNoaWxkKGNoaWxkKVxuICAgICAgLy8gbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bkNoaWxkLmJpbmQodGhpcywgY2hpbGQuaWQpKVxuICAgICAgdGhpcy5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG4gICAgICB0aGlzLmNoaWxkcmVuW2NoaWxkLmlkXSA9IG5vZGVcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICAvKlxuICAgIHRoaXMuZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmZvb3Rlci5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1pdGVtX2Zvb3RlcidcbiAgICB2YXIgem9vbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKVxuICAgIHpvb20uY2xhc3NOYW1lID0gJ2ZhIGZhLWV4cGFuZCB6b29tJ1xuICAgIHpvb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm8ub25ab29tKVxuICAgIHRoaXMuZm9vdGVyLmFwcGVuZENoaWxkKHpvb20pXG4gICAgKi9cblxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLnRpdGxlKVxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLmJvZHkpXG4gICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHpvb20pXG4gICAgLy8gdGhpcy5ub2RlLmFwcGVuZENoaWxkKHRoaXMuZm9vdGVyKVxuXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChkYXRhLmNvbnRlbnQpXG4gICAgdGhpcy5jb250ZW50ID0gZGF0YS5jb250ZW50XG4gICAgcmV0dXJuIHRoaXMubm9kZVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBwaWQ6IHRoZSBpZCBvZiB0aGlzIGJsb2NrXG4gICAqIGNpZDogdGhlIGNoaWxkIHRoYXQgaXMgYmVpbmcgbW92ZWRcbiAgICogY2hpbGRyZW46IGxpc3Qgb2YgY2hpbGQgaWRzXG4gICAqL1xuICBnZXRDaGlsZFRhcmdldHM6IGZ1bmN0aW9uIChjaWQsIGJpZCwgY2hpbGRyZW4pIHtcbiAgICB2YXIgdGFyZ2V0cyA9IGNoaWxkcmVuID8gY2hpbGRyZW4ubWFwKHRoaXMuY2hpbGRUYXJnZXQuYmluZCh0aGlzLCBiaWQpKSA6IFtdXG4gICAgdGFyZ2V0cy5wdXNoKHRoaXMud2hvbGVUYXJnZXQoYmlkLCBjaGlsZHJlbi5sZW5ndGgpKVxuICAgIHJldHVybiB0YXJnZXRzXG4gIH0sXG5cbiAgY2hpbGRUYXJnZXQ6IGZ1bmN0aW9uIChwaWQsIGlkLCBpKSB7XG4gICAgdmFyIGJveCA9IHRoaXMuY2hpbGRyZW5baWRdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIG1hZ2ljID0gMTBcbiAgICByZXR1cm4ge1xuICAgICAgaGl0OiB7XG4gICAgICAgIGxlZnQ6IGJveC5sZWZ0LFxuICAgICAgICByaWdodDogYm94LnJpZ2h0LFxuICAgICAgICB0b3A6IGJveC50b3AgLSBtYWdpYyxcbiAgICAgICAgYm90dG9tOiBib3guYm90dG9tIC0gbWFnaWNcbiAgICAgIH0sXG4gICAgICBwb3M6IGksXG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGRyYXc6IHtcbiAgICAgICAgbGVmdDogYm94LmxlZnQsXG4gICAgICAgIHdpZHRoOiBib3gud2lkdGgsXG4gICAgICAgIHRvcDogYm94LnRvcCAtIG1hZ2ljLzIsXG4gICAgICAgIGhlaWdodDogbWFnaWNcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIGlkOiB0aGUgYm94IGlkXG4gICAqIGxhc3Q6IHRoZSBsYXN0IGluZGV4IGluIHRoZSBjaGlsZCBsaXN0XG4gICAqL1xuICB3aG9sZVRhcmdldDogZnVuY3Rpb24gKGlkLCBsYXN0KSB7XG4gICAgdmFyIGJveCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgLCBtYWdpYyA9IDEwXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpdDogYm94LFxuICAgICAgcGlkOiBpZCxcbiAgICAgIHBvczogbGFzdCxcbiAgICAgIGRyYXc6IHtcbiAgICAgICAgdG9wOiBib3guYm90dG9tIC0gbWFnaWMsXG4gICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgbWFnaWMvMixcbiAgICAgICAgaGVpZ2h0OiBtYWdpYyxcbiAgICAgICAgd2lkdGg6IGJveC53aWR0aCAtIG1hZ2ljXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG5cbiAgLy8gQ2hpbGRyZW4hIVxuXG5cbiAgLy8gTm90IGNoaWxkcmVuISFcblxuICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB0aGlzLnJlcG9zaXRpb24oY29uZmlnLmxlZnQsIGNvbmZpZy50b3AsIHRydWUpXG4gICAgLy8gdGhpcy5yZXNpemUoY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0LCB0cnVlKVxuICB9LFxuXG4gIHNldENvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgaWYgKGNvbnRlbnQgPT09IHRoaXMuY29udGVudCkgcmV0dXJuXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChjb250ZW50KVxuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShjb250ZW50KVxuICB9LFxuXG4gIF9vbkJsdXI6IGZ1bmN0aW9uIChlKSB7XG4gICAgdGhpcy5zdG9wRWRpdGluZygpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2hhbmRsZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFlLnNoaWZ0S2V5KSByZXR1cm5cbiAgICB2YXIgcmVjdCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGlmICh0aGlzLm8uc3RhcnRNb3ZpbmcoZSwgcmVjdCwgdHJ1ZSkpIHtcbiAgICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLWl0ZW0tLW1vdmluZycpXG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gIH0sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMuX21vdmVkKSB7XG4gICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5zdGFydEVkaXRpbmcoKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIF9vbk1vdXNlTW92ZUNoaWxkOiBmdW5jdGlvbiAoaWQsIGUpIHtcbiAgICBpZiAoIWUuc2hpZnRLZXkpIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHZhciBjbG9uZSA9IHRoaXMuY2hpbGRyZW5baWRdLmxhc3RDaGlsZC5jbG9uZU5vZGUodHJ1ZSlcbiAgICBpZiAodGhpcy5vLnN0YXJ0TW92aW5nQ2hpbGQoZSwgaWQsIGNsb25lLCB0cnVlKSkge1xuICAgICAgdGhpcy5jaGlsZHJlbltpZF0uY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1tb3ZpbmcnKVxuICAgIH1cbiAgfSxcblxuICBfb25Nb3VzZURvd25DaGlsZDogZnVuY3Rpb24gKGlkLCBlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHZhciBjbG9uZSA9IHRoaXMuY2hpbGRyZW5baWRdLmxhc3RDaGlsZC5jbG9uZU5vZGUodHJ1ZSlcbiAgICBpZiAodGhpcy5vLnN0YXJ0TW92aW5nQ2hpbGQoZSwgaWQsIGNsb25lKSkge1xuICAgICAgdGhpcy5jaGlsZHJlbltpZF0uY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1tb3ZpbmcnKVxuICAgIH1cbiAgfSxcblxuICBfb25Nb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5fbW92ZWQgPSBmYWxzZVxuICAgIGlmIChlLnRhcmdldCAhPT0gdGhpcy5pbnB1dCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKVxuICAgIH1cbiAgICB2YXIgcmVjdCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLWl0ZW0tLW1vdmluZycpXG4gICAgdGhpcy5vLnN0YXJ0TW92aW5nKGUsIHJlY3QpXG4gICAgICAvLywgdG9wID0gZS5jbGllbnRZIC0gcmVjdC50b3BcbiAgICAgIC8vLCBsZWZ0ID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0XG4gICAgLyoqXG4gICAgICogVE9ETzogcmVzaXphYmlsaXR5ID9cbiAgICBpZiAobGVmdCA+IHJlY3Qud2lkdGggLSAxMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhcnRSZXNpemluZygneCcpXG4gICAgfVxuICAgIGlmICh0b3AgPiByZWN0LmhlaWdodCAtIDEwKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFydFJlc2l6aW5nKCd5JylcbiAgICB9XG4gICAgICovXG4gICAgLy90aGlzLm8uc3RhcnRNb3ZpbmcobGVmdCwgdG9wKVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIHJlbW92ZUNoaWxkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoIXRoaXMuY2hpbGRyZW5baWRdKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbltpZF0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNoaWxkcmVuW2lkXSlcbiAgICBkZWxldGUgdGhpcy5jaGlsZHJlbltpZF1cbiAgfSxcblxuICBhZGRDaGlsZDogZnVuY3Rpb24gKGNoaWxkLCBpZCwgYmVmb3JlKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZUNoaWxkKGNoaWxkKVxuICAgIGlmIChiZWZvcmUgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ib2R5Lmluc2VydEJlZm9yZShub2RlLCB0aGlzLmNoaWxkcmVuW2JlZm9yZV0pXG4gICAgfVxuICAgIHRoaXMuY2hpbGRyZW5baWRdID0gbm9kZVxuICB9LFxuXG4gIGNyZWF0ZUNoaWxkOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICBub2RlLmNsYXNzTmFtZT0nd2hpdGVib2FyZC1pdGVtX2NoaWxkJ1xuICAgIGlmIChjaGlsZC5jaGlsZHJlbiAmJiBjaGlsZC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1wYXJlbnQnKVxuICAgIH1cbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgYm9keS5pbm5lckhUTUwgPSBjaGlsZC5jb250ZW50ID8gbWFya2VkKGNoaWxkLmNvbnRlbnQpIDogJzxlbT5DbGljayBoZXJlIHRvIGVkaXQ8L2VtPidcbiAgICB2YXIgaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBoYW5kbGUuY2xhc3NOYW1lID0gJ2hhbmRsZSdcbiAgICBoYW5kbGUuaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtY2lyY2xlXCIvPidcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmVDaGlsZC5iaW5kKHRoaXMsIGNoaWxkLmlkKSlcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd25DaGlsZC5iaW5kKHRoaXMsIGNoaWxkLmlkKSlcbiAgICBub2RlLmFwcGVuZENoaWxkKGhhbmRsZSlcbiAgICBub2RlLmFwcGVuZENoaWxkKGJvZHkpXG4gICAgcmV0dXJuIG5vZGVcbiAgfSxcblxuICBkb25lTW92aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3doaXRlYm9hcmQtaXRlbS0tbW92aW5nJylcbiAgfSxcblxuICBkb25lTW92aW5nQ2hpbGQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHRoaXMuY2hpbGRyZW5baWRdLmNsYXNzTGlzdC5yZW1vdmUoJ3doaXRlYm9hcmQtaXRlbV9jaGlsZC0tbW92aW5nJylcbiAgfSxcblxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uIChmcm9tU3RhcnQpIHtcbiAgICBpZiAodGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICB0aGlzLm5vZGUuY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtLS1lZGl0aW5nJylcbiAgICB0aGlzLmVkaXRpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZSh0aGlzLmNvbnRlbnQpXG4gICAgdGhpcy5ub2RlLnJlcGxhY2VDaGlsZCh0aGlzLmlucHV0LCB0aGlzLnRpdGxlKVxuICAgIHRoaXMuaW5wdXQuZm9jdXMoKTtcbiAgICB0aGlzLnNldFNlbGVjdGlvbighZnJvbVN0YXJ0KVxuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd3aGl0ZWJvYXJkLWl0ZW0tLWVkaXRpbmcnKVxuICAgIGNvbnNvbGUubG9nKCdzdG9wIGVkZGludCcsIHRoaXMuaXNOZXcpXG4gICAgdmFyIHZhbHVlID0gdGhpcy5nZXRJbnB1dFZhbHVlKClcbiAgICB0aGlzLmVkaXRpbmcgPSBmYWxzZVxuICAgIHRoaXMubm9kZS5yZXBsYWNlQ2hpbGQodGhpcy50aXRsZSwgdGhpcy5pbnB1dClcbiAgICBpZiAodGhpcy5jb250ZW50ICE9IHZhbHVlKSB7XG4gICAgICB0aGlzLnNldFRleHRDb250ZW50KHZhbHVlKVxuICAgICAgdGhpcy5jb250ZW50ID0gdmFsdWVcbiAgICAgIHRoaXMuby5jaGFuZ2VDb250ZW50KHRoaXMuY29udGVudClcbiAgICB9XG4gIH0sXG5cbiAgc2V0U2VsZWN0aW9uOiBmdW5jdGlvbiAoZW5kKSB7XG4gICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuICAgIHNlbC5zZWxlY3RBbGxDaGlsZHJlbih0aGlzLmlucHV0KVxuICAgIHRyeSB7XG4gICAgICBzZWxbJ2NvbGxhcHNlVG8nICsgKGVuZCA/ICdFbmQnIDogJ1N0YXJ0JyldKClcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zdGFydEVkaXRpbmcoKVxuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnRpdGxlLmlubmVySFRNTCA9IHZhbHVlID8gbWFya2VkKHZhbHVlKSA6ICcnXG4gIH0sXG5cbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5pbnB1dC5pbm5lckhUTUwgPSB2YWx1ZVxuICB9LFxuXG4gIGdldElucHV0VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdW5Fc2NhcGVIdG1sKHRoaXMuaW5wdXQuaW5uZXJIVE1MKVxuICB9LFxuXG4gIHJlcG9zaXRpb246IGZ1bmN0aW9uICh4LCB5LCBzaWxlbnQpIHtcbiAgICBpZiAoeCAhPT0gdGhpcy54IHx8IHkgIT09IHRoaXMueSkge1xuICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXG4gICAgfVxuICAgIHRoaXMueCA9IHhcbiAgICB0aGlzLnkgPSB5XG4gICAgdGhpcy5ub2RlLnN0eWxlLnRvcCA9IHkgKyAncHgnXG4gICAgdGhpcy5ub2RlLnN0eWxlLmxlZnQgPSB4ICsgJ3B4J1xuICAgIGlmICghc2lsZW50KSB7XG4gICAgICB0aGlzLnNhdmVDb25maWcoKVxuICAgIH1cbiAgfSxcblxuICByZXNpemU6IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBzaWxlbnQpIHtcbiAgICB0aGlzLndpZHRoID0gd2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxuICAgIHRoaXMubm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4J1xuICAgIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHRoaXMuc2F2ZUNvbmZpZygpXG4gICAgfVxuICB9LFxuXG4gIHNhdmVDb25maWc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm8uc2F2ZUNvbmZpZyh7XG4gICAgICBsZWZ0OiB0aGlzLngsXG4gICAgICB0b3A6IHRoaXMueSxcbiAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodFxuICAgIH0pXG4gIH0sXG5cbiAgc2F2ZUNvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm8uc2F2ZUNvbnRlbnQodGhpcy5jb250ZW50KVxuICB9LFxuXG4gIG1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcbiAgfSxcblxuICBtb3VzZVVwOiBmdW5jdGlvbiAoZSkge1xuICB9LFxuXG4gIGNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIHRoaXMuc3RhcnRFZGl0aW5nKClcbiAgfSxcblxuICBibHVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zdG9wRWRpdGluZygpXG4gIH0sXG5cbiAga2V5RG93bjogZnVuY3Rpb24gKGUpIHtcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICBWaWV3OiByZXF1aXJlKCcuL3ZpZXcnKVxufVxuXG4iLCJcbnZhciBEdW5nZW9uc0FuZERyYWdvbnMgPSByZXF1aXJlKCcuLi8uLi9saWIvZG5kLmpzJylcbnZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2snKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdcblxuZnVuY3Rpb24gVmlldyhiaW5kQWN0aW9ucywgbW9kZWwsIGN0cmwsIG9wdGlvbnMpIHtcbiAgdGhpcy5tb2RlID0gJ25vcm1hbCdcbiAgdGhpcy5hY3RpdmUgPSBudWxsXG4gIHRoaXMuaWRzID0ge31cblxuICB0aGlzLmJpbmRBY3Rpb25zID0gYmluZEFjdGlvbnNcbiAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gIHRoaXMuY3RybCA9IGN0cmxcblxuICB0aGlzLl9ib3VuZE1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpXG4gIHRoaXMuX2JvdW5kVXAgPSB0aGlzLl9vbk1vdXNlVXAuYmluZCh0aGlzKVxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXAuYmluZCh0aGlzKSlcbn1cblxuVmlldy5wcm90b3R5cGUgPSB7XG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmlkc1tyb290XVxuICAgIHRoaXMuc2V0dXBSb290KClcbiAgICB0aGlzLnJvb3QgPSByb290XG4gICAgdGhpcy5tYWtlQmxvY2tzKHJvb3QpXG4gICAgcmV0dXJuIHRoaXMucm9vdE5vZGVcbiAgfSxcblxuICBzZXR1cFJvb3Q6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm9vdE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHJvb3ROb2RlLmNsYXNzTmFtZT0nd2hpdGVib2FyZCdcbiAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX29uQ2xpY2suYmluZCh0aGlzKSlcbiAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bi5iaW5kKHRoaXMpKVxuICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5fb25XaGVlbC5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5oZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmhlYWQuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmQtaGVhZCdcbiAgICB0aGlzLmhlYWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkNsaWNrSGVhZC5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JylcbiAgICB0aGlzLmlucHV0LnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgdHJ1ZSlcbiAgICB0aGlzLmlucHV0LmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWlucHV0LWhlYWQnXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fb25CbHVySGVhZC5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWNvbnRhaW5lcidcblxuICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuY29udHJvbHMuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmQtY29udHJvbHMnXG4gICAgdmFyIGIxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJylcbiAgICBiMS5pbm5lckhUTUwgPSAnMToxJ1xuICAgIGIxLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZXNldENvbnRhaW5lci5iaW5kKHRoaXMpKVxuICAgIHZhciBiMiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXG4gICAgYjIuaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtdGgtbGFyZ2VcIi8+J1xuICAgIGIyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZXNldFBvc2l0aW9ucy5iaW5kKHRoaXMpKVxuICAgIHRoaXMuY29udHJvbHMuYXBwZW5kQ2hpbGQoYjEpXG4gICAgdGhpcy5jb250cm9scy5hcHBlbmRDaGlsZChiMilcblxuICAgIHRoaXMuZHJvcFNoYWRvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5kcm9wU2hhZG93LmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWRyb3BzaGFkb3cnXG5cbiAgICB0aGlzLmJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lcilcbiAgICB0aGlzLmJvZHkuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmQtYm9keSdcbiAgICB0aGlzLmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLl9vbkRvdWJsZUNsaWNrLmJpbmQodGhpcykpXG5cbiAgICB0aGlzLnZsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLnZsaW5lLmNsYXNzTmFtZT0nd2hpdGVib2FyZF92bGluZSdcbiAgICB0aGlzLmhsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmhsaW5lLmNsYXNzTmFtZT0nd2hpdGVib2FyZF9obGluZSdcbiAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQodGhpcy52bGluZSlcbiAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5obGluZSlcbiAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kcm9wU2hhZG93KVxuICAgIHRoaXMuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2xzKVxuXG4gICAgcm9vdE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5oZWFkKVxuICAgIHJvb3ROb2RlLmFwcGVuZENoaWxkKHRoaXMuYm9keSlcblxuICAgIHRoaXMucm9vdE5vZGUgPSByb290Tm9kZVxuICAgIHRoaXMuc2V0Q29udGFpbmVyWm9vbSgxKVxuICAgIHRoaXMuc2V0Q29udGFpbmVyUG9zKDAsIDApXG4gIH0sXG5cbiAgLy8gQ29udHJvbGxlciAvIENvbW1hbmRzIEFQSSBzdHVmZlxuXG4gIGdldEFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJvb3RcbiAgfSxcblxuICBhZGRUcmVlOiBmdW5jdGlvbiAobm9kZSwgYmVmb3JlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50ICE9PSB0aGlzLnJvb3QpIHJldHVybjtcbiAgICB0aGlzLm1ha2VCbG9jayhub2RlLmlkLCAwKVxuICB9LFxuXG4gIGFkZDogZnVuY3Rpb24gKG5vZGUsIGJlZm9yZSwgZG9udGZvY3VzKSB7XG4gICAgaWYgKG5vZGUucGFyZW50ID09PSB0aGlzLnJvb3QpIHtcbiAgICAgIHZhciBibG9jayA9IHRoaXMubWFrZUJsb2NrKG5vZGUuaWQsIDApXG4gICAgICBibG9jay5ub2RlLnN0eWxlLnpJbmRleCA9IE9iamVjdC5rZXlzKHRoaXMuaWRzKS5sZW5ndGhcbiAgICAgIGlmICghZG9udGZvY3VzKSB7XG4gICAgICAgIGJsb2NrLmZvY3VzKClcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIXRoaXMuaWRzW25vZGUucGFyZW50XSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuaWRzW25vZGUucGFyZW50XS5hZGRDaGlsZChub2RlLCB0aGlzLm1vZGVsKVxuICB9LFxuXG4gIHNldENvbGxhcHNlZDogZnVuY3Rpb24gKCkge1xuICB9LFxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgfSxcbiAgc2V0QWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG4gIHNldFNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIG1vdmU6IGZ1bmN0aW9uIChpZCwgcGlkLCBiZWZvcmUsIG9waWQsIGxhc3RjaGlsZCkge1xuICAgIGlmICh0aGlzLmlkc1tvcGlkXSkge1xuICAgICAgdGhpcy5pZHNbb3BpZF0ucmVtb3ZlQ2hpbGQoaWQpXG4gICAgfSBlbHNlIGlmIChvcGlkID09IHRoaXMucm9vdCkge1xuICAgICAgdGhpcy5pZHNbaWRdLnJlbW92ZSgpXG4gICAgICBkZWxldGUgdGhpcy5pZHNbaWRdXG4gICAgfVxuICAgIGlmICh0aGlzLmlkc1twaWRdKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZHNbcGlkXS5hZGRDaGlsZCh0aGlzLm1vZGVsLmlkc1tpZF0sIGlkLCBiZWZvcmUpXG4gICAgfVxuICAgIGlmIChwaWQgIT09IHRoaXMucm9vdCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuYWRkKHRoaXMubW9kZWwuaWRzW2lkXSwgYmVmb3JlKVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgY29uc29sZS53YXJuKFwiRklYPz9cIilcbiAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmlkc1tpZF0ubm9kZSlcbiAgICBkZWxldGUgdGhpcy5pZHNbaWRdXG4gIH0sXG4gIGdvVG86IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLndhcm4oJ0ZJWCEnKTtcbiAgfSxcbiAgY2xlYXI6IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmlkcykge1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5pZHNbaWRdLm5vZGUpXG4gICAgfVxuICAgIHRoaXMuaWRzID0ge31cbiAgICB0aGlzLnNldENvbnRhaW5lclBvcygwLCAwKVxuICAgIHRoaXMuc2V0Q29udGFpbmVyWm9vbSgxKTtcbiAgfSxcblxuICByZWJhc2U6IGZ1bmN0aW9uIChuZXdyb290LCB0cmlnZ2VyKSB7XG4gICAgdGhpcy5jbGVhcigpXG4gICAgdGhpcy5yb290ID0gbmV3cm9vdFxuICAgIHRoaXMubWFrZUJsb2NrcyhuZXdyb290KVxuICAgIHRoaXMuY3RybC50cmlnZ2VyKCdyZWJhc2UnLCBuZXdyb290KVxuICB9LFxuXG4gIHNldEF0dHI6IGZ1bmN0aW9uIChpZCwgYXR0ciwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuaWRzW2lkXSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChhdHRyID09PSAnd2hpdGVib2FyZCcpIHtcbiAgICAgIGlmICghdmFsdWUgfHwgIXZhbHVlLnRvcCkge1xuICAgICAgICB2YXIgY2ggPSB0aGlzLm1vZGVsLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuXG4gICAgICAgICAgLCBpID0gY2guaW5kZXhPZihpZClcbiAgICAgICAgICAsIGRlZmF1bHRXaWR0aCA9IDMwMFxuICAgICAgICAgICwgZGVmYXVsdEhlaWdodCA9IDEwMFxuICAgICAgICAgICwgbWFyZ2luID0gMTBcbiAgICAgICAgdmFsdWUgPSB7XG4gICAgICAgICAgdG9wOiAxMCArIHBhcnNlSW50KGkgLyA0KSAqIChkZWZhdWx0SGVpZ2h0ICsgbWFyZ2luKSxcbiAgICAgICAgICBsZWZ0OiAxMCArIChpICUgNCkgKiAoZGVmYXVsdFdpZHRoICsgbWFyZ2luKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmlkc1tpZF0udXBkYXRlQ29uZmlnKHZhbHVlKVxuICAgIH1cbiAgICAvLyBUT0RPIHNvbWV0aGluZyB3aXRoIGRvbmUtbmVzcz9cbiAgfSxcblxuICBzZXRDb250ZW50OiBmdW5jdGlvbiAoaWQsIGNvbnRlbnQpIHtcbiAgICBpZiAoIXRoaXMuaWRzW2lkXSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuaWRzW2lkXS5zZXRDb250ZW50KGNvbnRlbnQpXG4gIH0sXG5cbiAgc2V0Um9vdENvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgdGhpcy5oZWFkLmlubmVySFRNTCA9IG1hcmtlZChjb250ZW50KTtcbiAgfSxcblxuICBtYWtlQmxvY2tzOiBmdW5jdGlvbiAocm9vdCkge1xuICAgIHRoaXMuc2V0Um9vdENvbnRlbnQodGhpcy5tb2RlbC5pZHNbcm9vdF0uY29udGVudCk7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5tb2RlbC5pZHNbcm9vdF0uY2hpbGRyZW5cbiAgICBpZiAoIWNoaWxkcmVuKSByZXR1cm5cbiAgICBjaGlsZHJlbi5mb3JFYWNoKHRoaXMubWFrZUJsb2NrLmJpbmQodGhpcykpO1xuICB9LFxuXG4gIG1ha2VCbG9jazogZnVuY3Rpb24gKGlkLCBpKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmlkc1tpZF1cbiAgICAgICwgY29uZmlnID0gbm9kZS5tZXRhLndoaXRlYm9hcmRcbiAgICAgIC8vIFRPRE86IG1hZ2ljIG51bWJlcnM/XG4gICAgICAsIGRlZmF1bHRXaWR0aCA9IDMwMFxuICAgICAgLCBkZWZhdWx0SGVpZ2h0ID0gMTAwXG4gICAgICAsIG1hcmdpbiA9IDEwXG4gICAgaWYgKCFjb25maWcpIHtcbiAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgLy8gd2lkdGg6IDIwMCxcbiAgICAgICAgLy8gaGVpZ2h0OiAyMDAsXG4gICAgICAgIHRvcDogMTAgKyBwYXJzZUludChpIC8gNCkgKiAoZGVmYXVsdEhlaWdodCArIG1hcmdpbiksXG4gICAgICAgIGxlZnQ6IDEwICsgKGkgJSA0KSAqIChkZWZhdWx0V2lkdGggKyBtYXJnaW4pXG4gICAgICB9XG4gICAgfVxuICAgIHZhciBjaGlsZHJlbiA9IChub2RlLmNoaWxkcmVuIHx8IFtdKS5tYXAoZnVuY3Rpb24gKGlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pZHNbaWRdXG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2sobm9kZSwgY2hpbGRyZW4sIGNvbmZpZywge1xuICAgICAgc2F2ZUNvbmZpZzogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICB0aGlzLmN0cmwuZXhlY3V0ZUNvbW1hbmRzKCdjaGFuZ2VOb2RlQXR0cicsIFtub2RlLmlkLCAnd2hpdGVib2FyZCcsIGNvbmZpZ10pO1xuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgc2F2ZUNvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICAgIHRoaXMuY3RybC5leGVjdXRlQ29tbWFuZHMoJ2NoYW5nZUNvbnRlbnQnLCBbbm9kZS5pZCwgY29udGVudF0pO1xuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgY2hhbmdlQ29udGVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5jdHJsLmV4ZWN1dGVDb21tYW5kcygnY2hhbmdlQ29udGVudCcsIFtub2RlLmlkLCBjb250ZW50XSk7XG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgICBzdGFydE1vdmluZzogdGhpcy5fb25TdGFydE1vdmluZy5iaW5kKHRoaXMsIG5vZGUuaWQpLFxuICAgICAgc3RhcnRNb3ZpbmdDaGlsZDogdGhpcy5fb25TdGFydE1vdmluZ0NoaWxkLmJpbmQodGhpcywgbm9kZS5pZCksXG4gICAgICBvblpvb206IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZWJhc2Uobm9kZS5pZClcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICB9KVxuICAgIHRoaXMuaWRzW2lkXSA9IGJsb2NrXG4gICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoYmxvY2subm9kZSlcbiAgICByZXR1cm4gYmxvY2tcbiAgfSxcblxuICAvKipcbiAgICogSWYgdGhlIGN1cnJlbnQgaXMgb3ZlciBhIHRhcmdldCwgc2hvdyB0aGUgZHJvcCBzaGFkb3cuXG4gICAqL1xuICB1cGRhdGVEcm9wVGFyZ2V0OiBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHZhciB0XG4gICAgLypcbiAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldCkge1xuICAgICAgdCA9IHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXRcbiAgICAgIGlmICh4ID49IHQuaGl0LmxlZnQgJiYgeCA8PSB0LmhpdC5yaWdodCAmJlxuICAgICAgICAgIHkgPj0gdC5oaXQudG9wICYmIHkgPD0gdC5oaXQuYm90dG9tKSB7XG4gICAgICAgIC8vIGp1c3Qga2VlcCB0aGUgY3VycmVudCBvbmVcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuICAgICovXG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMubW92aW5nLnRhcmdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHQgPSB0aGlzLm1vdmluZy50YXJnZXRzW2ldXG4gICAgICBpZiAoeCA+PSB0LmhpdC5sZWZ0ICYmIHggPD0gdC5oaXQucmlnaHQgJiZcbiAgICAgICAgICB5ID49IHQuaGl0LnRvcCAmJiB5IDw9IHQuaGl0LmJvdHRvbSkge1xuICAgICAgICB0aGlzLm1vdmluZy5jdXJyZW50VGFyZ2V0ID0gdFxuICAgICAgICB0aGlzLnNob3dEcm9wU2hhZG93KHQuZHJhdylcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldCA9IG51bGxcbiAgICB0aGlzLmhpZGVEcm9wU2hhZG93KClcbiAgICByZXR1cm4gZmFsc2VcbiAgfSxcblxuICAvKipcbiAgICogQ29sbGVjdCBhIGxpc3Qgb2YgdGFyZ2V0cyBcbiAgICovXG4gIGZpbmRUYXJnZXRzOiBmdW5jdGlvbiAoY2hpbGRyZW4sIGlkLCBpc0NoaWxkKSB7XG4gICAgdmFyIHRhcmdldHMgPSBbXVxuICAgICAgLCBzbmFwcyA9IFtdXG4gICAgICAsIHJvb3QgPSB0aGlzLmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBmb3IgKHZhciBpID0gY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChpZCA9PSBjaGlsZHJlbltpXSkgY29udGludWU7XG4gICAgICB2YXIgY2hpbGRpZHMgPSB0aGlzLm1vZGVsLmlkc1tjaGlsZHJlbltpXV0uY2hpbGRyZW5cbiAgICAgICAgLCBjaGlsZCA9IHRoaXMuaWRzW2NoaWxkcmVuW2ldXVxuICAgICAgICAsIHdob2xlID0gY2hpbGQud2hvbGVUYXJnZXQoaWQsIGNoaWxkaWRzLmxlbmd0aClcbiAgICAgIHRhcmdldHMgPSB0YXJnZXRzLmNvbmNhdChjaGlsZC5nZXRDaGlsZFRhcmdldHMoaWQsIGNoaWxkcmVuW2ldLCBjaGlsZGlkcykpXG4gICAgICB0YXJnZXRzLnB1c2god2hvbGUpXG4gICAgICBpZiAoIWlzQ2hpbGQpIHtcbiAgICAgICAgc25hcHMucHVzaCh7XG4gICAgICAgICAgdG9wOiB3aG9sZS5oaXQudG9wIC0gcm9vdC50b3AsXG4gICAgICAgICAgbGVmdDogd2hvbGUuaGl0LmxlZnQgLSByb290LmxlZnQsXG4gICAgICAgICAgcmlnaHQ6IHdob2xlLmhpdC5yaWdodCAtIHJvb3QubGVmdCxcbiAgICAgICAgICBib3R0b206IHdob2xlLmhpdC5ib3R0b20gLSByb290LnRvcFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdGFyZ2V0czogdGFyZ2V0cyxcbiAgICAgIHNuYXBzOiBzbmFwc1xuICAgIH1cbiAgfSxcblxuICB0cnlTbmFwOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgIC8vIGNvbnZlcnQgdG8gc2NyZWVuIGNvb3Jkc1xuICAgIHggPSB4ICogdGhpcy5fem9vbSArIHRoaXMueFxuICAgIHkgPSB5ICogdGhpcy5fem9vbSArIHRoaXMueVxuICAgIHZhciBoID0gdGhpcy5tb3ZpbmcuaGVpZ2h0XG4gICAgICAsIHcgPSB0aGlzLm1vdmluZy53aWR0aFxuICAgICAgLCBiID0geSArIGhcbiAgICAgICwgciA9IHggKyB3XG4gICAgICAsIGFsbG93YW5jZSA9IDIwICogdGhpcy5fem9vbVxuICAgICAgLCBzcGFjZSA9IDEwICogdGhpcy5fem9vbVxuXG4gICAgaWYgKGFsbG93YW5jZSA8IDIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIFRPRE86IHNob3cgZ3VpZGluZyBsaW5lc1xuICAgIHZhciBsaW5lcyA9IFtdXG4gICAgICAsIGR4ID0gZmFsc2VcbiAgICAgICwgZHkgPSBmYWxzZVxuXG4gICAgdGhpcy5tb3Zpbmcuc25hcHMuZm9yRWFjaChmdW5jdGlvbiAoc25hcCkge1xuICAgICAgaWYgKCFkeSkge1xuICAgICAgICAvLyB0b3BcbiAgICAgICAgaWYgKE1hdGguYWJzKHNuYXAudG9wIC0gc3BhY2UgLSBiKSA8IGFsbG93YW5jZSkge1xuICAgICAgICAgIHkgPSBzbmFwLnRvcCAtIHNwYWNlIC0gaFxuICAgICAgICAgIGR5ID0gW3NuYXAubGVmdCwgc25hcC5yaWdodCwgc25hcC50b3AgLSBzcGFjZSAvIDJdXG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoc25hcC50b3AgLSB5KSA8IGFsbG93YW5jZSkge1xuICAgICAgICAgIHkgPSBzbmFwLnRvcFxuICAgICAgICAgIGR5ID0gW3NuYXAubGVmdCwgc25hcC5yaWdodCwgc25hcC50b3AgLSBzcGFjZSAvIDJdXG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoc25hcC5ib3R0b20gKyBzcGFjZSAtIHkpIDwgYWxsb3dhbmNlKSB7IC8vIGJvdHRvbVxuICAgICAgICAgIHkgPSBzbmFwLmJvdHRvbSArIHNwYWNlXG4gICAgICAgICAgZHkgPSBbc25hcC5sZWZ0LCBzbmFwLnJpZ2h0LCBzbmFwLmJvdHRvbSArIHNwYWNlIC8gMl1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhzbmFwLmJvdHRvbSAtIGIpIDwgYWxsb3dhbmNlKSB7XG4gICAgICAgICAgeSA9IHNuYXAuYm90dG9tIC0gaFxuICAgICAgICAgIGR5ID0gW3NuYXAubGVmdCwgc25hcC5yaWdodCwgc25hcC5ib3R0b20gKyBzcGFjZSAvIDJdXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFkeCkge1xuICAgICAgICAvLyBsZWZ0XG4gICAgICAgIGlmIChNYXRoLmFicyhzbmFwLmxlZnQgLSBzcGFjZSAtIHIpIDwgYWxsb3dhbmNlKSB7XG4gICAgICAgICAgeCA9IHNuYXAubGVmdCAtIHNwYWNlIC0gd1xuICAgICAgICAgIGR4ID0gW3NuYXAudG9wLCBzbmFwLmJvdHRvbSwgc25hcC5sZWZ0IC0gc3BhY2UgLyAyXVxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKHNuYXAubGVmdCAtIHgpIDwgYWxsb3dhbmNlKSB7XG4gICAgICAgICAgeCA9IHNuYXAubGVmdFxuICAgICAgICAgIGR4ID0gW3NuYXAudG9wLCBzbmFwLmJvdHRvbSwgc25hcC5sZWZ0IC0gc3BhY2UgLyAyXVxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKHNuYXAucmlnaHQgKyBzcGFjZSAtIHgpIDwgYWxsb3dhbmNlKSB7IC8vIHJpZ2h0XG4gICAgICAgICAgeCA9IHNuYXAucmlnaHQgKyBzcGFjZVxuICAgICAgICAgIGR4ID0gW3NuYXAudG9wLCBzbmFwLmJvdHRvbSwgc25hcC5yaWdodCArIHNwYWNlIC8gMl1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhzbmFwLnJpZ2h0IC0gcikgPCBhbGxvd2FuY2UpIHtcbiAgICAgICAgICB4ID0gc25hcC5yaWdodCAtIHdcbiAgICAgICAgICBkeCA9IFtzbmFwLnRvcCwgc25hcC5ib3R0b20sIHNuYXAucmlnaHQgKyBzcGFjZSAvIDJdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKGR4KSB7XG4gICAgICB2YXIgaHQgPSBNYXRoLm1pbihkeFswXSwgeSlcbiAgICAgICAgLCBoYiA9IE1hdGgubWF4KGR4WzFdLCB5ICsgaClcbiAgICAgIHRoaXMudmxpbmUuc3R5bGUubGVmdCA9IGR4WzJdIC0gMSArICdweCdcbiAgICAgIHRoaXMudmxpbmUuc3R5bGUudG9wID0gaHQgLSBzcGFjZS8yICsgJ3B4J1xuICAgICAgdGhpcy52bGluZS5zdHlsZS5oZWlnaHQgPSAoaGIgLSBodCkgKyBzcGFjZSArICdweCdcbiAgICAgIHRoaXMudmxpbmUuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52bGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgfVxuXG4gICAgaWYgKGR5KSB7XG4gICAgICB2YXIgdmwgPSBNYXRoLm1pbihkeVswXSwgeClcbiAgICAgICAgLCB2ciA9IE1hdGgubWF4KGR5WzFdLCB4ICsgdylcbiAgICAgIHRoaXMuaGxpbmUuc3R5bGUudG9wID0gZHlbMl0gLSAxICsgJ3B4J1xuICAgICAgdGhpcy5obGluZS5zdHlsZS5sZWZ0ID0gdmwgLSBzcGFjZS8yICsgJ3B4J1xuICAgICAgdGhpcy5obGluZS5zdHlsZS53aWR0aCA9ICh2ciAtIHZsKSArIHNwYWNlICsgJ3B4J1xuICAgICAgdGhpcy5obGluZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhsaW5lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICB9XG5cbiAgICBpZiAoZHggfHwgZHkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6ICh4IC0gdGhpcy54KS90aGlzLl96b29tLFxuICAgICAgICB5OiAoeSAtIHRoaXMueSkvdGhpcy5fem9vbVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfSxcblxuICBnZXRCeVpJbmRleDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIGZvciAodmFyIGlkIGluIHRoaXMuaWRzKSB7XG4gICAgICBpdGVtcy5wdXNoKFsrdGhpcy5pZHNbaWRdLm5vZGUuc3R5bGUuekluZGV4LCBpZF0pXG4gICAgfVxuICAgIGl0ZW1zLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHJldHVybiBhWzBdIC0gYlswXVxuICAgIH0pXG4gICAgcmV0dXJuIGl0ZW1zLm1hcChmdW5jdGlvbiAoaXRlbSkge3JldHVybiBpdGVtWzFdfSlcbiAgfSxcblxuICBzaHVmZmxlWkluZGljZXM6IGZ1bmN0aW9uICh0b3ApIHtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLmdldEJ5WkluZGV4KClcbiAgICBmb3IgKHZhciBpPTA7IGk8aXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuaWRzW2l0ZW1zW2ldXS5ub2RlLnN0eWxlLnpJbmRleCA9IGlcbiAgICB9XG4gICAgdGhpcy5pZHNbdG9wXS5ub2RlLnN0eWxlLnpJbmRleCA9IGl0ZW1zLmxlbmd0aFxuICAgIHJldHVybiBpdGVtc1xuICB9LFxuXG4gIC8vIGV2ZW50IGhhbmRsZXJzXG5cbiAgX29uQ2xpY2tIZWFkOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHRoaXMuc3RhcnRFZGl0aW5nKClcbiAgfSxcblxuICBfb25CbHVySGVhZDogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB0aGlzLnN0b3BFZGl0aW5nKClcbiAgfSxcblxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlucHV0LnZhbHVlID0gdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jb250ZW50XG4gICAgdGhpcy5yb290Tm9kZS5yZXBsYWNlQ2hpbGQodGhpcy5pbnB1dCwgdGhpcy5oZWFkKVxuICAgIHRoaXMuaW5wdXQuZm9jdXMoKVxuICAgIHRoaXMuaW5wdXQuc2VsZWN0aW9uU3RhcnQgPSB0aGlzLmlucHV0LnNlbGVjdGlvbkVuZCA9IHRoaXMuaW5wdXQudmFsdWUubGVuZ3RoXG4gIH0sXG5cbiAgc3RvcEVkaXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmN0cmwuZXhlY3V0ZUNvbW1hbmRzKCdjaGFuZ2VDb250ZW50JywgW3RoaXMucm9vdCwgdGhpcy5pbnB1dC52YWx1ZV0pXG4gICAgdGhpcy5zZXRSb290Q29udGVudCh0aGlzLmlucHV0LnZhbHVlKVxuICAgIHRoaXMucm9vdE5vZGUucmVwbGFjZUNoaWxkKHRoaXMuaGVhZCwgdGhpcy5pbnB1dClcbiAgfSxcblxuICBfb25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS50YXJnZXQgPT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpXG4gICAgfVxuICB9LFxuXG4gIF9vbkRvdWJsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldCAhPT0gdGhpcy5ib2R5KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdmFyIGJveCA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdmFyIHggPSBlLmNsaWVudFggLSA1MCAtIGJveC5sZWZ0XG4gICAgICAsIHkgPSBlLmNsaWVudFkgLSAxMCAtIGJveC50b3BcbiAgICAgICwgaWR4ID0gdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5sZW5ndGhcbiAgICB0aGlzLmN0cmwuZXhlY3V0ZUNvbW1hbmRzKCduZXdOb2RlJywgW3RoaXMucm9vdCwgaWR4LCAnJywge1xuICAgICAgd2hpdGVib2FyZDoge1xuICAgICAgICAvLyB3aWR0aDogMjAwLFxuICAgICAgICAvLyBoZWlnaHQ6IDIwMCxcbiAgICAgICAgdG9wOiB5LFxuICAgICAgICBsZWZ0OiB4XG4gICAgICB9XG4gICAgfV0pO1xuICB9LFxuXG4gIF9vbldoZWVsOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGlmICh0aGlzLm1vdmluZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciB4LCB5XG4gICAgdmFyIGRlbHRhWCA9IC1lLmRlbHRhWCwgZGVsdGFZID0gLWUuZGVsdGFZXG4gICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgIHZhciByb290ID0gdGhpcy5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICB4ID0gZS5jbGllbnRYIC0gcm9vdC5sZWZ0XG4gICAgICB5ID0gZS5jbGllbnRZIC0gcm9vdC50b3BcbiAgICAgIHRoaXMuem9vbU1vdmUoKGRlbHRhWSAvIDUwMCksIHgsIHkpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgeCA9IHRoaXMueFxuICAgIHkgPSB0aGlzLnlcbiAgICB0aGlzLnNldENvbnRhaW5lclBvcyh4ICsgZGVsdGFYLCB5ICsgZGVsdGFZKVxuICB9LFxuXG4gIF9vbk1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS50YXJnZXQgIT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB2YXIgeCA9IGUuY2xpZW50WCAtIGJveC5sZWZ0XG4gICAgICAsIHkgPSBlLmNsaWVudFkgLSBib3gudG9wXG4gICAgdGhpcy5tb3ZpbmcgPSB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeSxcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fYm91bmRNb3ZlKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9ib3VuZFVwKVxuICB9LFxuXG4gIF9vblN0YXJ0TW92aW5nOiBmdW5jdGlvbiAoaWQsIGUsIHJlY3QsIHNoaWZ0TW92ZSkge1xuICAgIGlmICh0aGlzLm1vdmluZykgcmV0dXJuIGZhbHNlO1xuICAgIHZhciB5ID0gZS5jbGllbnRZIC8gdGhpcy5fem9vbSAtIHJlY3QudG9wL3RoaXMuX3pvb21cbiAgICAgICwgeCA9IGUuY2xpZW50WCAvIHRoaXMuX3pvb20gLSByZWN0LmxlZnQvdGhpcy5fem9vbVxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuc2h1ZmZsZVpJbmRpY2VzKGlkKVxuICAgIHZhciBib3hlcyA9IHRoaXMuZmluZFRhcmdldHMoY2hpbGRyZW4sIGlkKVxuICAgIHRoaXMubW92aW5nID0ge1xuICAgICAgc2hpZnQ6IHNoaWZ0TW92ZSxcbiAgICAgIHRhcmdldHM6IGJveGVzLnRhcmdldHMsXG4gICAgICBzbmFwczogYm94ZXMuc25hcHMsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgICBhdHg6IHRoaXMuaWRzW2lkXS54LFxuICAgICAgYXR5OiB0aGlzLmlkc1tpZF0ueSxcbiAgICAgIGlkOiBpZCxcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5LFxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgX29uU3RhcnRNb3ZpbmdDaGlsZDogZnVuY3Rpb24gKGlkLCBlLCBjaWQsIGhhbmRsZSwgc2hpZnRNb3ZlKSB7XG4gICAgaWYgKHRoaXMubW92aW5nKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGJveCA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdmFyIHggPSBlLmNsaWVudFgvdGhpcy5fem9vbSAtIGJveC5sZWZ0L3RoaXMuX3pvb21cbiAgICAgICwgeSA9IGUuY2xpZW50WS90aGlzLl96b29tIC0gYm94LnRvcC90aGlzLl96b29tXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRCeVpJbmRleCgpXG4gICAgdmFyIGJveGVzID0gdGhpcy5maW5kVGFyZ2V0cyhjaGlsZHJlbiwgY2lkLCB0cnVlKVxuICAgIHRoaXMubW92aW5nID0ge1xuICAgICAgc2hpZnQ6IHNoaWZ0TW92ZSxcbiAgICAgIHRhcmdldHM6IGJveGVzLnRhcmdldHMsXG4gICAgICBzbmFwczogYm94ZXMuc25hcHMsXG4gICAgICBoYW5kbGU6IGhhbmRsZSxcbiAgICAgIGNoaWxkOiBjaWQsXG4gICAgICBwYXJlbnRfaWQ6IGlkLFxuICAgICAgb3R5OiB4LFxuICAgICAgb3R4OiB5LFxuICAgICAgeDogeCxcbiAgICAgIHk6IHlcbiAgICB9XG4gICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoaGFuZGxlKVxuICAgIHRoaXMudXBkYXRlRHJvcFRhcmdldChlLmNsaWVudFgsIGUuY2xpZW50WSlcbiAgICBoYW5kbGUuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmRfY2hpbGQtaGFuZGxlJ1xuICAgIGhhbmRsZS5zdHlsZS50b3AgPSB5ICsgJ3B4J1xuICAgIGhhbmRsZS5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgX29uS2V5VXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTYgJiYgdGhpcy5tb3ZpbmcgJiYgdGhpcy5tb3Zpbmcuc2hpZnQpIHtcbiAgICAgIHRoaXMuc3RvcE1vdmluZygpXG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIXRoaXMubW92aW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb25Nb3VzZVVwKGUpXG4gICAgfVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKHRoaXMubW92aW5nLmNoaWxkKSB7XG4gICAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIHZhciB4ID0gZS5jbGllbnRYL3RoaXMuX3pvb20gLSBib3gubGVmdC90aGlzLl96b29tXG4gICAgICAgICwgeSA9IGUuY2xpZW50WS90aGlzLl96b29tIC0gYm94LnRvcC90aGlzLl96b29tXG4gICAgICB0aGlzLm1vdmluZy5oYW5kbGUuc3R5bGUudG9wID0geSArICdweCdcbiAgICAgIHRoaXMubW92aW5nLmhhbmRsZS5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICAgIHRoaXMubW92aW5nLnggPSB4XG4gICAgICB0aGlzLm1vdmluZy55ID0geVxuICAgICAgdGhpcy51cGRhdGVEcm9wVGFyZ2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW92aW5nLmlkKSB7XG4gICAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIHZhciB4ID0gZS5jbGllbnRYL3RoaXMuX3pvb20gLSBib3gubGVmdC90aGlzLl96b29tIC0gdGhpcy5tb3ZpbmcueFxuICAgICAgICAsIHkgPSBlLmNsaWVudFkvdGhpcy5fem9vbSAtIGJveC50b3AvdGhpcy5fem9vbSAtIHRoaXMubW92aW5nLnlcbiAgICAgIGlmICghdGhpcy51cGRhdGVEcm9wVGFyZ2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAvLyBubyBkcm9wIHBsYWNlIHdhcyBmb3VuZCwgbGV0J3Mgc25hcCFcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMudHJ5U25hcCh4LCB5KVxuICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgeCA9IHBvcy54XG4gICAgICAgICAgeSA9IHBvcy55XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubW92aW5nLmF0eCA9IHhcbiAgICAgIHRoaXMubW92aW5nLmF0eSA9IHlcbiAgICAgIHRoaXMuaWRzW3RoaXMubW92aW5nLmlkXS5yZXBvc2l0aW9uKHgsIHksIHRydWUpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IFxuXG4gICAgLy8gZHJhZ2dpbmcgdGhlIGNhbnZhc1xuICAgIHZhciBib3ggPSB0aGlzLmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB2YXIgeCA9IGUuY2xpZW50WCAtIGJveC5sZWZ0IC0gdGhpcy5tb3ZpbmcueFxuICAgICAgLCB5ID0gZS5jbGllbnRZIC0gYm94LnRvcCAtIHRoaXMubW92aW5nLnlcbiAgICB0aGlzLnNldENvbnRhaW5lclBvcyh4LCB5KVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5zdG9wTW92aW5nKClcbiAgICByZXR1cm4gZmFsc2VcbiAgfSxcblxuICByZXNldENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0Q29udGFpbmVyUG9zKDAsIDApXG4gICAgdGhpcy5zZXRDb250YWluZXJab29tKDEpXG4gIH0sXG5cbiAgcmVzZXRQb3NpdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY21kcyA9IFtdXG4gICAgdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgY21kcy5wdXNoKCdjaGFuZ2VOb2RlQXR0cicpXG4gICAgICBjbWRzLnB1c2goW2lkLCAnd2hpdGVib2FyZCcsIG51bGxdKVxuICAgIH0pO1xuICAgIHRoaXMuY3RybC5leGVjdXRlQ29tbWFuZHMoY21kcylcbiAgfSxcblxuICB6b29tTW92ZTogZnVuY3Rpb24gKGRlbHRhLCB4LCB5KSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLl96b29tICogZGVsdGFcbiAgICAgICwgbnogPSB0aGlzLl96b29tICsgbmV4dFxuICAgICAgLCBzY2FsZSA9IHRoaXMuX3pvb20gLyBuelxuICAgICAgLCBueCA9IHggLSB4IC8gc2NhbGVcbiAgICAgICwgbnkgPSB5IC0geSAvIHNjYWxlXG4gICAgdGhpcy5zZXRDb250YWluZXJQb3ModGhpcy54L3NjYWxlICsgbngsIHRoaXMueS9zY2FsZSArIG55KVxuICAgIHRoaXMuc2V0Q29udGFpbmVyWm9vbShueilcbiAgfSxcblxuICBzZXRDb250YWluZXJab29tOiBmdW5jdGlvbiAobnVtKSB7XG4gICAgdGhpcy5fem9vbSA9IG51bVxuICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLldlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgnICsgbnVtICsgJyknXG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKCcgKyBudW0gKyAnKSdcbiAgfSxcblxuICBzZXRDb250YWluZXJQb3M6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdGhpcy54ID0geFxuICAgIHRoaXMueSA9IHlcbiAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS50b3AgPSB5ICsgJ3B4J1xuICB9LFxuXG4gIC8vIG90aGVyIHN0dWZmXG5cbiAgc3RvcE1vdmluZ0NoaWxkOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETyBtb3ZlIGludG9cbiAgICB0aGlzLm1vdmluZy5oYW5kbGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm1vdmluZy5oYW5kbGUpXG4gICAgdmFyIHBvcyA9IHRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY2hpbGRyZW4ubGVuZ3RoXG5cbiAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldCkge1xuICAgICAgdmFyIHBvcyA9IHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQucG9zXG4gICAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldC5waWQgPT0gdGhpcy5tb3ZpbmcucGFyZW50X2lkKSB7XG4gICAgICAgIGlmIChwb3MgPiB0aGlzLm1vZGVsLmlkc1t0aGlzLm1vdmluZy5wYXJlbnRfaWRdLmNoaWxkcmVuLmluZGV4T2YodGhpcy5tb3ZpbmcuY2hpbGQpKSB7XG4gICAgICAgICAgcG9zIC09IDFcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsLmV4ZWN1dGVDb21tYW5kcygnbW92ZScsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgIHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQucGlkLFxuICAgICAgICBwb3NcbiAgICAgIF0sICdjaGFuZ2VOb2RlQXR0cicsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgbnVsbFxuICAgICAgXSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgdGhpcy5jdHJsLmV4ZWN1dGVDb21tYW5kcygnY2hhbmdlTm9kZUF0dHInLCBbXG4gICAgICAgIHRoaXMubW92aW5nLmNoaWxkLFxuICAgICAgICAnd2hpdGVib2FyZCcsXG4gICAgICAgIHt0b3A6IHRoaXMubW92aW5nLnksIGxlZnQ6IHRoaXMubW92aW5nLnh9XG4gICAgICBdLCAnbW92ZScsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgIHRoaXMucm9vdCxcbiAgICAgICAgcG9zXG4gICAgICBdKVxuXG4gICAgfVxuXG4gICAgdGhpcy5pZHNbdGhpcy5tb3ZpbmcucGFyZW50X2lkXS5kb25lTW92aW5nKClcbiAgfSxcblxuICBzaG93RHJvcFNoYWRvdzogZnVuY3Rpb24gKHJlY3QpIHtcbiAgICB2YXIgYm94ID0gdGhpcy5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIHJlYWxoZWlnaHQgPSByZWN0LmhlaWdodCAqIHRoaXMuX3pvb21cbiAgICAgICwgeW9mZiA9IChyZWN0LmhlaWdodCAtIHJlYWxoZWlnaHQpIC8gMlxuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS50b3AgPSByZWN0LnRvcCAtIGJveC50b3AgKyB5b2ZmICsgJ3B4J1xuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS5sZWZ0ID0gcmVjdC5sZWZ0IC0gYm94LmxlZnQgKyAncHgnXG4gICAgdGhpcy5kcm9wU2hhZG93LnN0eWxlLndpZHRoID0gcmVjdC53aWR0aCArICdweCdcbiAgICB0aGlzLmRyb3BTaGFkb3cuc3R5bGUuaGVpZ2h0ID0gcmVhbGhlaWdodCArICdweCdcbiAgICB0aGlzLmRyb3BTaGFkb3cuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgfSxcblxuICBoaWRlRHJvcFNoYWRvdzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gIH0sXG5cbiAgc3RvcE1vdmluZ01haW46IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlkc1t0aGlzLm1vdmluZy5pZF0ucmVwb3NpdGlvbih0aGlzLm1vdmluZy5hdHgsIHRoaXMubW92aW5nLmF0eSlcbiAgICB0aGlzLmlkc1t0aGlzLm1vdmluZy5pZF0uZG9uZU1vdmluZygpXG4gICAgaWYgKHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHRoaXMuY3RybC5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbXG4gICAgICAgIHRoaXMubW92aW5nLmlkLFxuICAgICAgICB0aGlzLm1vdmluZy5jdXJyZW50VGFyZ2V0LnBpZCxcbiAgICAgICAgdGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldC5wb3NcbiAgICAgIF0sICdjaGFuZ2VOb2RlQXR0cicsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuaWQsXG4gICAgICAgICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgbnVsbFxuICAgICAgXSk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3BNb3Zpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5tb3ZpbmcuY2hpbGQpIHtcbiAgICAgIHRoaXMuc3RvcE1vdmluZ0NoaWxkKClcbiAgICB9IGVsc2UgaWYgKHRoaXMubW92aW5nLmlkKSB7XG4gICAgICB0aGlzLnN0b3BNb3ZpbmdNYWluKClcbiAgICB9XG4gICAgaWYgKHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHRoaXMuaGlkZURyb3BTaGFkb3coKVxuICAgIH1cbiAgICB0aGlzLm1vdmluZyA9IG51bGxcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy52bGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgdGhpcy5obGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICB9LFxuXG4gIGdldE5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290Tm9kZVxuICB9XG59XG5cbiIsIlxudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi8uLi9saWIvY29udHJvbGxlcicpXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi91dGlsJylcblxuICAsIFdGTm9kZSA9IHJlcXVpcmUoJy4vbm9kZScpXG4gICwgV0ZWaWV3ID0gcmVxdWlyZSgnLi92aWV3JylcbiAgLCBXRlZMID0gcmVxdWlyZSgnLi92bCcpXG5cbm1vZHVsZS5leHBvcnRzID0gV0ZDb250cm9sbGVyXG5cbmZ1bmN0aW9uIFdGQ29udHJvbGxlcihtb2RlbCwgb3B0aW9ucykge1xuICBDb250cm9sbGVyLmNhbGwodGhpcywgbW9kZWwsIG9wdGlvbnMpXG4gIHRoaXMub24oJ3JlYmFzZScsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgdGhpcy50cmlnZ2VyKCdidWxsZXQnLCB0aGlzLm1vZGVsLmdldExpbmVhZ2UoaWQpKVxuICB9LmJpbmQodGhpcykpXG59XG5cbldGQ29udHJvbGxlci5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZChPYmplY3QuY3JlYXRlKENvbnRyb2xsZXIucHJvdG90eXBlKSwge1xuICByZWZyZXNoQnVsbGV0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy50cmlnZ2VyKCdidWxsZXQnLCB0aGlzLm1vZGVsLmdldExpbmVhZ2UodGhpcy5tb2RlbC5yb290KSlcbiAgfVxufSlcblxuV0ZDb250cm9sbGVyLnByb3RvdHlwZS5hY3Rpb25zID0gdXRpbC5leHRlbmQoe1xuICBjbGlja0J1bGxldDogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgdGhpcy52aWV3LnJlYmFzZShpZClcbiAgICB0aGlzLnRyaWdnZXIoJ2J1bGxldCcsIHRoaXMubW9kZWwuZ2V0TGluZWFnZShpZCkpXG4gIH0sXG4gIGJhY2tBTGV2ZWw6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm9vdCA9IHRoaXMudmlldy5yb290XG4gICAgICAsIHBpZCA9IHRoaXMubW9kZWwuaWRzW3Jvb3RdLnBhcmVudFxuICAgIGlmICghdGhpcy5tb2RlbC5pZHNbcGlkXSkgcmV0dXJuXG4gICAgdGhpcy5hY3Rpb25zLmNsaWNrQnVsbGV0KHBpZClcbiAgfVxufSwgQ29udHJvbGxlci5wcm90b3R5cGUuYWN0aW9ucylcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVyJyksXG4gIE1vZGVsOiByZXF1aXJlKCcuL21vZGVsJyksXG4gIE5vZGU6IHJlcXVpcmUoJy4vbm9kZScpLFxuICBWaWV3OiByZXF1aXJlKCcuL3ZpZXcnKSxcbiAgVmlld0xheWVyOiByZXF1aXJlKCcuL3ZsJyksXG59XG5cbiIsIlxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi4vLi4vbGliL21vZGVsJylcblxubW9kdWxlLmV4cG9ydHMgPSBXRk1vZGVsXG5cbmZ1bmN0aW9uIFdGTW9kZWwoKSB7XG4gIE1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuV0ZNb2RlbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1vZGVsLnByb3RvdHlwZSlcblxuV0ZNb2RlbC5wcm90b3R5cGUuZ2V0TGluZWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICB2YXIgbGluZWFnZSA9IFtdXG4gIHdoaWxlICh0aGlzLmlkc1tpZF0pIHtcbiAgICBsaW5lYWdlLnVuc2hpZnQoe1xuICAgICAgY29udGVudDogdGhpcy5pZHNbaWRdLmNvbnRlbnQsXG4gICAgICBpZDogaWRcbiAgICB9KVxuICAgIGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICB9XG4gIHJldHVybiBsaW5lYWdlXG59XG5cbldGTW9kZWwucHJvdG90eXBlLnNlYXJjaCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIHZhciBpdGVtcyA9IFtdXG4gICAgLCBmcm9udGllciA9IFt0aGlzLnJvb3RdXG4gIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKClcbiAgd2hpbGUgKGZyb250aWVyLmxlbmd0aCkge1xuICAgICAgdmFyIG5leHQgPSBbXVxuICAgICAgZm9yICh2YXIgaT0wOyBpPGZyb250aWVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzLmlkc1tmcm9udGllcltpXV0uY29udGVudFxuICAgICAgICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgaXRlbXMucHVzaCh7aWQ6IGZyb250aWVyW2ldLCB0ZXh0OiB0aGlzLmlkc1tmcm9udGllcltpXV0uY29udGVudH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuaWRzW2Zyb250aWVyW2ldXS5jaGlsZHJlblxuICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgbmV4dCA9IG5leHQuY29uY2F0KGNoaWxkcmVuKVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZyb250aWVyID0gbmV4dFxuICB9XG4gIHJldHVybiBpdGVtc1xufVxuXG4iLCJcbnZhciBEZWZhdWx0Tm9kZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kZWZhdWx0LW5vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdGTm9kZVxuXG5mdW5jdGlvbiBXRk5vZGUoY29udGVudCwgbWV0YSwgb3B0aW9ucywgaXNOZXcpIHtcbiAgRGVmYXVsdE5vZGUuY2FsbCh0aGlzLCBjb250ZW50LCBtZXRhLCBvcHRpb25zLCBpc05ldylcbiAgdGhpcy5kb25lID0gbWV0YS5kb25lXG59XG5cbldGTm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERlZmF1bHROb2RlLnByb3RvdHlwZSlcbldGTm9kZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBXRk5vZGVcblxuV0ZOb2RlLnByb3RvdHlwZS5zZXRBdHRyID0gZnVuY3Rpb24gKGF0dHIsIHZhbHVlKSB7XG4gIGlmIChhdHRyICE9PSAnZG9uZScpIHtcbiAgICBEZWZhdWx0Tm9kZS5wcm90b3R5cGUuc2V0QXR0ci5jYWxsKHRoaXMsIGF0dHIsIHZhbHVlKVxuICAgIHJldHVyblxuICB9XG4gIHRoaXMuc2V0RG9uZSh2YWx1ZSlcbn1cblxuV0ZOb2RlLnByb3RvdHlwZS5zZXREb25lID0gZnVuY3Rpb24gKGlzRG9uZSkge1xuICB0aGlzLmRvbmUgPSBpc0RvbmVcbiAgaWYgKGlzRG9uZSkge1xuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fZGVmYXVsdC1ub2RlLS1kb25lJylcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm5vZGUuY2xhc3NMaXN0LnJlbW92ZSgndHJlZWRfX2RlZmF1bHQtbm9kZS0tZG9uZScpXG4gIH1cbn1cblxuV0ZOb2RlLnByb3RvdHlwZS5leHRyYV9hY3Rpb25zID0ge1xuICAncmViYXNlJzoge1xuICAgIGJpbmRpbmc6ICdhbHQrcmV0dXJuJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuby5jbGlja0J1bGxldCgpXG4gICAgfVxuICB9LFxuICAnYmFjayBhIGxldmVsJzoge1xuICAgIGJpbmRpbmc6ICdzaGlmdCthbHQrcmV0dXJuJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuby5iYWNrQUxldmVsKClcbiAgICB9XG4gIH0sXG4gICd0b2dnbGUgZG9uZSc6IHtcbiAgICBiaW5kaW5nOiAnY3RybCtyZXR1cm4nLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5ibHVyKClcbiAgICAgIHRoaXMuby5jaGFuZ2VkKCdkb25lJywgIXRoaXMuZG9uZSlcbiAgICAgIHRoaXMuZm9jdXMoKVxuICAgICAgaWYgKHRoaXMuZG9uZSkge1xuICAgICAgICB0aGlzLm8uZ29Eb3duKClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuIiwiXG52YXIgVmlldyA9IHJlcXVpcmUoJy4uLy4uL2xpYi92aWV3JylcblxubW9kdWxlLmV4cG9ydHMgPSBXRlZpZXdcblxuZnVuY3Rpb24gV0ZWaWV3KCkge1xuICBWaWV3LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuV0ZWaWV3LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVmlldy5wcm90b3R5cGUpXG5cbldGVmlldy5wcm90b3R5cGUuZXh0cmFfYWN0aW9ucyA9IHtcbiAgJ3JlYmFzZSc6IHtcbiAgICBiaW5kaW5nOiAnYWx0K3JldHVybicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmN0cmwuYWN0aW9ucy5jbGlja0J1bGxldCh0aGlzLmFjdGl2ZSlcbiAgICB9XG4gIH0sXG4gICdiYWNrIGEgbGV2ZWwnOiB7XG4gICAgYmluZGluZzogJ3NoaWZ0K2FsdCtyZXR1cm4nLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMuYmFja0FMZXZlbCgpXG4gICAgfVxuICB9LFxuICAndG9nZ2xlIGRvbmUnOiB7XG4gICAgYmluZGluZzogJ2N0cmwrcmV0dXJuJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB2YXIgaWQgPSB0aGlzLmFjdGl2ZVxuICAgICAgICAsIGRvbmUgPSAhdGhpcy5tb2RlbC5pZHNbaWRdLm1ldGEuZG9uZVxuICAgICAgICAsIG5leHQgPSB0aGlzLm1vZGVsLmlkQmVsb3coaWQsIHRoaXMucm9vdClcbiAgICAgIGlmIChuZXh0ID09PSB1bmRlZmluZWQpIG5leHQgPSBpZFxuICAgICAgdGhpcy5jdHJsLmFjdGlvbnMuY2hhbmdlZCh0aGlzLmFjdGl2ZSwgJ2RvbmUnLCBkb25lKVxuICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgdGhpcy5nb1RvKG5leHQpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbiIsIlxudmFyIERvbVZpZXdMYXllciA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kb20tdmwnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdGVkxcblxuZnVuY3Rpb24gV0ZWTCgpIHtcbiAgRG9tVmlld0xheWVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuV0ZWTC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERvbVZpZXdMYXllci5wcm90b3R5cGUpXG5cbldGVkwucHJvdG90eXBlLm1ha2VIZWFkID0gZnVuY3Rpb24gKGJvZHksIGFjdGlvbnMpIHtcbiAgdmFyIGhlYWQgPSBEb21WaWV3TGF5ZXIucHJvdG90eXBlLm1ha2VIZWFkLmNhbGwodGhpcywgYm9keSwgYWN0aW9ucylcbiAgICAsIGJ1bGxldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIGJ1bGxldC5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fYnVsbGV0JylcbiAgYnVsbGV0LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGFjdGlvbnMuY2xpY2tCdWxsZXQpXG4gIGhlYWQuaW5zZXJ0QmVmb3JlKGJ1bGxldCwgaGVhZC5jaGlsZE5vZGVzWzFdKVxuICByZXR1cm4gaGVhZFxufVxuXG4iXX0=
(9)
});

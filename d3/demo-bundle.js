!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.demo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var nm = _dereq_('../../lib')

module.exports = {
  run: runDemo,
  preload: preload,
  skins: {
    wf: _dereq_('../../skins/workflowy'),
    wb: _dereq_('../../skins/whiteboard')
  },
  pl: {
    Mem: _dereq_('../../lib/pl/mem'),
    Firebase: _dereq_('../../lib/pl/firebase')
  }
}

function merge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
}

function preload(scripts, cb) {
  var waiting = 0
  scripts.forEach(function (name) {
    waiting += 1
    var node = document.createElement('script')
    node.src = name
    var done = false
    node.onload = node.onreadystatechange = function () {
      if (done || (this.readyState && this.readyState !== 'loaded' && this.readyState !== 'complete')) {
        return
      }
      done = true
      node.onload = node.onreadystatechange = null
      waiting -= 1
      if (!waiting) {
        cb()
      }
    }
    document.body.appendChild(node)
  })
}

function runDemo(options, done) {
  var o = merge({
    noTitle: false,
    title: 'Treed Example',
    el: 'example',
    Model: nm.Model,
    Controller: nm.Controller,
    View: nm.View,
    viewOptions: {
      ViewLayer: nm.ViewLayer,
      Node: nm.Node
    },
    style: [],
    data: demoData,
    ctrlOptions: {},
    initDB: function () {},
  }, options)

  if (!o.noTitle) {
    document.title = o.title
    document.getElementById('title').textContent = o.title
  }

  o.style.forEach(function (name) {
    var style = document.createElement('link');
    style.rel = 'stylesheet'
    style.href = name
    document.head.appendChild(style);
  });

  var db = o.pl || new module.exports.pl.Mem({});

  db.init(function (err) {
    if (err) {
      return loadFailed(err);
    }

    initDB(db, function (err, root, map, wasEmpty) {

      window.model = new o.Model(root, map, db)
      window.ctrl = window.controller = new o.Controller(model, o.ctrlOptions)
      window.view = window.view = ctrl.setView(
        o.View,
        o.viewOptions
      );
      if (wasEmpty) {
        for (var i=0;i<o.data.children.length; i++) {
          ctrl.importData(o.data.children[i], root.id);
        }
        if (options.initDB) options.initDB(window.model)
        window.view.rebase(root.id);
      }
      document.getElementById(o.el).appendChild(view.getNode());

      done && done(window.model, window.ctrl, window.view, db)

    });
  });
}

function initDB(db, done) {
  db.findAll('root', function (err, roots) {
    if (err) return done(err)

    if (!roots.length) {
      return loadDefault(db, done)
    }

    db.findAll('node', function (err, nodes) {
      if (err) return done(new Error('Failed to load items'))
      if (!nodes.length) return done(new Error("Data corrupted - could not find root node"))

      var map = {}
      for (var i=0; i<nodes.length; i++) {
        map[nodes[i].id] = nodes[i]
      }
      done(null, roots[0], map, false)
    })
  })
}

function loadDefault(db, done) {
  var ROOT_ID = 50

  // load default
  db.save('root', ROOT_ID, {id: ROOT_ID}, function () {
    var map = {}
    map[ROOT_ID] = {
      id: ROOT_ID,
      children: [],
      collapsed: false,
      content: "Home",
      meta: {},
      depth: 0
    }

    db.save('node', ROOT_ID, map[ROOT_ID], function () {
      done(null, {id: ROOT_ID}, map, true)
    })
  })
}


},{"../../lib":11,"../../lib/pl/firebase":17,"../../lib/pl/mem":18,"../../skins/whiteboard":26,"../../skins/workflowy":30}],2:[function(_dereq_,module,exports){

module.exports = BaseNode

var keys = _dereq_('./keys')
  , util = _dereq_('./util')

function BaseNode(content, meta, options, isNew, modelActions) {
  this.content = content || ''
  this.isNew = isNew
  this.modelActions = modelActions
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
      if (!this.isNew) {
        this.stopEditing()
      }
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


},{"./keys":13,"./util":21}],3:[function(_dereq_,module,exports){

var commands = _dereq_('./commands')

module.exports = Commandeger

function makeCommand(type, args, commands) {
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
function Commandeger(model, extra_commands) {
  this.history = []
  this.histpos = 0
  this.view = null
  this.listeners = {}
  this.working = false
  this.model = model
  this.commands = commands
  if (extra_commands) {
    for (var name in extra_commands) {
      this.commands[name] = extra_commands[name]
    }
  }
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
    var results = [];
    var i
    for (i=0; i<arguments.length; i+=2) {
      cmds.push(makeCommand(arguments[i], arguments[i+1], this.commands))
    }
    if (this.histpos > 0) {
      this.history = this.history.slice(0, -this.histpos)
      this.histpos = 0
    }
    this.history.push(cmds)
    for (i=0; i<cmds.length; i++) {
      results.push(this.doCommand(cmds[i]))
    }
    this.trigger('change')
    return results
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
      , ix = this.history.length - pos
    if (ix < 0) {
      return false // no more undo!
    }
    var cmds = this.history[ix]
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
      , ix = this.history.length - 1 - pos
    if (ix >= this.history.length) {
      return false // no more to redo!
    }
    var cmds = this.history[ix]
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
    var result = this.commands[cmd.type].apply.call(cmd.data, this.view, this.model)
    this.working = false
    return result
  },

  undoCommand: function (cmd) {
    this.working = true
    this.commands[cmd.type].undo.call(cmd.data, this.view, this.model)
    this.working = false
  },

  redoCommand: function (cmd) {
    this.working = true
    var c = this.commands[cmd.type]
    ;(c.redo || c.apply).call(cmd.data, this.view, this.model)
    this.working = false
  },
}


},{"./commands":4}],4:[function(_dereq_,module,exports){

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
        if (model.ids[cr.node.parent].collapsed) {
          view.setCollapsed(cr.node.parent, false)
          model.setCollapsed(cr.node.parent, false)
        }
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

}


},{}],5:[function(_dereq_,module,exports){

module.exports = Controller

var Commandeger = _dereq_('./commandeger')

  , util = _dereq_('./util')

function Controller(model, o) {
  this.o = util.extend({
    noCollapseRoot: true,
    extra_commands: false
  }, o || {})
  this.model = model
  this.cmd = new Commandeger(this.model, this.o.extra_commands)

  this.model.db.listen('node', this.addFromDb.bind(this), this.updateFromDb.bind(this))

  var actions = {}
  for (var action in this.actions) {
    if ('string' === typeof this.actions[action]) actions[action] = this.actions[action]
    else actions[action] = this.actions[action].bind(this)
  }
  this.actions = actions
  this.listeners = {}
}

Controller.prototype = {
  addFromDb: function (id, data) {
    // if (this.model.ids[id]) return
    this.view.update(id, data)
    this.model.ids[id] = data
  },
  updateFromDb: function (id, data) {
    this.view.update(id, data)
    this.model.ids[id] = data
  },

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
      this.model, this.actions,
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

  importData: function (data, parent) {
    if (arguments.length === 1) {
      parent = this.view.getActive();
    }
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
    var res
    if (arguments.length === 1 && Array.isArray(arguments[0])) {
      res = this.cmd.executeCommands.apply(this.cmd, arguments[0])
    } else {
      res = this.cmd.executeCommands.apply(this.cmd, arguments)
    }
    this.trigger('change')
    return res
  },

  // public
  setCollapsed: function (id, doCollapse) {
    if (this.o.noCollapseRoot && id === this.view.root) return
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

    setActive: function (id) {
      this.view.setActive(id)
    },

    // move focus
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

    pasteAbove: function (id) {
      return this.actions.paste(id, true)
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

    // move node
    move: function (where, id, target) {
      var action = {
        before: 'ToBefore',
        after: 'ToAfter',
        child: 'Into',
        lastChild: 'IntoLast'
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

    moveIntoLast: function (id, pid) {
      if (id === this.view.root) return
      if (id === 'new') return
      var ix = this.model.ids[pid].children.length
      if (this.model.samePlace(id, {pid: pid, ix: ix})) return
      if (!this.model.isCollapsed(pid)) {
        return this.executeCommands('move', [id, pid, ix])
      }
      this.executeCommands('collapse', [pid, false], 'move', [id, pid, ix])
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
      if (place.pid === this.model.ids[this.view.root].parent) return
      this.executeCommands('move', [id, place.pid, place.ix])
    },

    moveDown: function (id) {
      if (id === this.view.root) return
      if (id === 'new') return
      // TODO handle multiple selected
      var place = this.model.shiftDownPlace(id)
      if (!place) return
      if (place.pid === this.model.ids[this.view.root].parent) return
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
      if (this.o.noCollapseRoot && id === this.view.root) return
      if (id === 'new') return
      if (arguments.length === 1) {
        yes = !this.model.hasChildren(id) || !this.model.isCollapsed(id)
      }
      if (yes) {
        id = this.model.findCollapser(id)
        if (this.o.noCollapseRoot && id === this.view.root) return
        if (!this.model.hasChildren(id) || this.model.isCollapsed(id)) return
      } else {
        if (!this.model.hasChildren(id) || !this.model.isCollapsed(id)) return
      }
      this.executeCommands('collapse', [id, yes])
    },

    addChild: function (pid, index, content, config) {
      this.executeCommands('newNode', [pid, index, content, config])
    },

    commands: function () {
      this.executeCommands.apply(this, arguments)
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
        var node = this.model.ids[id]
        if (!node.children || !node.children.length) {
          if (this.view.newNode) return this.view.startEditing('new')
          this.view.addNew(id, 0)
          this.view.startEditing('new')
          return
        }
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


},{"./commandeger":3,"./util":21}],6:[function(_dereq_,module,exports){

module.exports = {
  visual: {
    'select up': 'k, up',
    'select down': 'j, down',
    'select to bottom': 'shift+g',
    'select to top': 'g g',
    'stop selecting': 'v, shift+v, escape',
    'edit': 'a, shift+a',
    'edit start': 'i, shift+i',
    'cut': 'd, shift+d, ctrl+x',
    'copy': 'y, shift+y, ctrl+c',
    'undo': 'u, ctrl+z',
    'redo': 'shift+r, ctrl+shift+z'
  },
  view: {
    base: {
      'cut': 'cmd+x, delete, d d',
      'copy': 'cmd+c, y y',
      'paste': 'p, cmd+v',
      'paste above': 'shift+p, cmd+shift+v',
      'visual mode': 'v, shift+v',

      'change': 'c c, shift+c',
      'edit': 'return, a, shift+a, f2',
      'edit start': 'i, shift+i',
      'first sibling': 'shift+[',
      'last sibling': 'shift+]',
      'move to first sibling': 'ctrl+shift+[',
      'move to last sibling': 'ctrl+shift+]',
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

    mac: {
    },
    pc: {
    }
  },
}



},{}],7:[function(_dereq_,module,exports){

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

function DefaultNode(content, meta, options, isNew, modelActions) {
  BaseNode.call(this, content, meta, options, isNew, modelActions)
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
    if (!this.input.firstChild) return ''
    return this.input.firstChild.textContent
  },

  isMultiLine: function () {
    return this.input.innerHTML.match(/(<div>|<br|\n)/g)
  },

  splitRightOfCursor: function () {
    var text = this.getVisibleValue()
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


},{"./base-node":2}],8:[function(_dereq_,module,exports){

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


},{}],9:[function(_dereq_,module,exports){

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
      targets.push({
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
      })
    }
    if (root === moving) return targets

    if (model.isCollapsed(root) && !top) return targets
    var ch = model.ids[root].children
    if (ch) {
      for (var i=0; i<ch.length; i++) {
        targets = targets.concat(this.dropTargets(ch[i], model, moving))
      }
    }
    if (top) {
      var bodyBox = this.dom[root].ul.getBoundingClientRect()
      targets.push({
        id: root,
        top: bodyBox.bottom,
        left: bodyBox.left,
        width: bodyBox.width,
        height: bc.height,
        place: 'lastChild',
        show: {
          left: bodyBox.left,// + 20,
          width: bodyBox.width,// - 20,
          y: bodyBox.bottom
        }
      })
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
    if (!n || !n.main.parentNode) return
    try {
      n.main.parentNode.removeChild(n.main)
    } catch (e) {
      return
    }
    delete this.dom[id]
    if (lastchild) {
      this.dom[pid].main.classList.remove('treed__item--parent')
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
  addNew: function (node, bounds, modelActions, before, children) {
    var dom = this.makeNode(node.id, node.content, node.meta, node.depth - this.rootDepth, bounds, modelActions)
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
    p.main.classList.add('treed__item--parent')
    if (children) {
      dom.classList.add('treed__item--parent')
    }
  },

  clearChildren: function (id) {
    var ul = this.dom[id].ul
    while (ul.lastChild) {
      ul.removeChild(ul.lastChild)
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
  makeRoot: function (node, bounds, modelActions) {
    var dom = this.makeNode(node.id, node.content, node.meta, 0, bounds, modelActions)
      , root = document.createElement('div')
    root.classList.add('treed')
    root.appendChild(dom)
    if (node.children.length) {
      dom.classList.add('treed__item--parent')
    }
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

    collapser.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return
      actions.toggleCollapse()
      e.preventDefault()
    })
    collapser.classList.add('treed__collapser')

    /*
    //  , mover = document.createElement('div')
    mover.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      actions.startMoving()
      return false
    })
    mover.classList.add('treed__mover')
    // head.appendChild(mover)
    */

    head.classList.add('treed__head')
    head.appendChild(collapser)
    head.appendChild(body.node);
    return head
  },

  /**
   * Make a node
   */
  makeNode: function (id, content, meta, level, bounds, modelActions) {
    var dom = document.createElement('li')
      , body = this.bodyFor(id, content, meta, bounds, modelActions)

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
  bodyFor: function (id, content, meta, bounds, modelActions) {
    var dom = new this.o.Node(content, meta, bounds, id === 'new', modelActions)
    dom.node.classList.add('treed__body')
    return dom
  },

}


},{"./drop-shadow":10,"./slide-down":19,"./slide-up":20,"./util":21}],10:[function(_dereq_,module,exports){

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


},{}],11:[function(_dereq_,module,exports){

module.exports = {
  Node: _dereq_('./default-node'),
  View: _dereq_('./view'),
  ViewLayer: _dereq_('./dom-vl'),
  Model: _dereq_('./model'),
  Controller: _dereq_('./controller'),
}


},{"./controller":5,"./default-node":7,"./dom-vl":9,"./model":14,"./view":23}],12:[function(_dereq_,module,exports){

module.exports = keyHandler

/**
 * Organize the keys definition, the actions definition, and the ctrlactions
 * all together in one lovely smorgasbord.
 *
 * keys: {action: key shortcut definition}
 * actions: {action: {action definition}}
 * ctrlactions: {name: function}
 */
function keyHandler(keys, actions, ctrlactions) {
  var bound = {}
  for (var action in keys) {
    if (!actions[action]) {
      throw new Error('invalid configuration: trying to bind unknown action. ' + action)
    }
    bound[keys[action]] = bindAction(action, actions[action], ctrlactions)
  }
  return bound
}

function bindAction(name, action, ctrlactions) {
  var pre = makePre(action.active)
  var type = typeof action.action
  var main
  switch (typeof action.action) {
    case 'string': main = ctrlactions[action.action]; break;
    case 'undefined': main = ctrlactions[camel(name)]; break;
    case 'function': main = action.action; break;
    default: throw new Error('unknown action ' + action.action)
  }

  if (!main) {
    throw new Error('Invalid action configuration ' + name)
  }

  if (!pre) {
    return main
  }

  return function () {
    if (!pre.call(this)) return
    return main.call(this, this.active)
  }
}

function makePre(active) {
  switch (active) {
    case true: return function(main) {
      return this.active
    }
    case '!new': return function (main) {
      return this.active && this.active !== 'new'
    }
    case '!root': return function (main) {
      return this.active && this.active !== this.root
    }
    default: return null
  }
}

function camel(string) {
  return string.replace(/ (\w)/, function (a, x) { return x.toUpperCase() })
}


},{}],13:[function(_dereq_,module,exports){

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
  if (code >= 48 && code <= 57) {
    return String.fromCharCode(code)
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
    if (e.metaKey) key = 'cmd+' + key
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



},{}],14:[function(_dereq_,module,exports){

var uuid = _dereq_('./uuid')

module.exports = Model

function Model(rootNode, ids, db) {
  this.ids = ids
  this.root = rootNode.id
  this.rootNode = rootNode
  this.db = db
  this.nextid = 100
  this.clipboard = false
  this.boundActions = this.bindActions()
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
    return uuid();
    /*
    while (this.ids[this.nextid]) {
      this.nextid += 1
    }
    var id = this.nextid
    this.nextid += 1
    return id + ''
    */
  },

  bindActions: function () {
    var bound = {}
    for (var name in this.actions) {
      bound[name] = this.actions[name].bind(this)
    }
    return bound
  },

  actions: {},

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
    if (n.children && n.children.length) {
      res.children = []
      for (var i=0; i<n.children.length; i++) {
        res.children.push(this.dumpData(n.children[i], noids))
      }
    }
    if (!noids) res.id = id
    res.collapsed = n.collapsed || false
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
    cr.node.collapsed = data.collapsed || false
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
      content: text || '',
      collapsed: false,
      type: type || 'base',
      meta: meta || {},
      parent: pid,
      children: []
    }
    this.ids[node.id] = node
    if (!this.ids[pid].children) {
      this.ids[pid].children = []
    }
    this.ids[pid].children.splice(index, 0, node.id)

    var before = false
    if (index < this.ids[pid].children.length - 1) {
      before = this.ids[pid].children[index + 1]
    }

    setTimeout(function () {
    this.db.save('node', node.id, node)
    this.db.update('node', pid, {children: this.ids[pid].children})
    }.bind(this))

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

    setTimeout(function () {
      this.db.remove('node', id)
      this.db.update('node', n.parent, {children: p.children})
      // TODO: remove all child nodes
    }.bind(this))

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
    return this.ids[id].children && this.ids[id].children.length
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
    if (!this.ids[pid].children) {
      this.ids[pid].children = []
    }
    if (index === false) index = this.ids[pid].children.length
    this.ids[pid].children.splice(index, 0, id)
    this.ids[id].parent = pid

    setTimeout(function () {
    this.db.update('node', opid, {children: p.children})
    this.db.update('node', id, {parent: pid})
    this.db.update('node', pid, {children: this.ids[pid].children})
    }.bind(this))

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
    var ix = parent.children.indexOf(id)
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
    var nix = parent.children.indexOf(id)
    if (pid === opid && parent.children.indexOf(tid) < nix) {
      nix -= 1
    }
    return {
      pid: pid,
      ix: nix
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


},{"./uuid":22}],15:[function(_dereq_,module,exports){
/*
 * true => 
 */

module.exports = {
  // not dealing with the active element
  'undo': {
    help: 'Undo the last action',
  },

  'redo': {
    help: 'Undo the last action',
  },

  'cut': {
    help: 'remove the currnetly selected item and place it in the clipboard',
    active: true,
  },

  'copy': {
    help: 'place the currently selected item in the clipboard',
    active: true,
  },

  'paste': {
    help: 'insert the contents of the clipboard, into or below the currently selected item',
    active: true,
  },

  'paste above': {
    help: 'insert the contents of the clipboard above the currently selected item',
    active: true,
  },

  'visual mode': {
    help: 'enter multi-select mode',
    active: '!root',
    action: function () {
      this.setSelection([this.active])
    },
  },

  'change': {
    help: 'clear the contents of this node and start editing',
    active: true,
    action: function () {
      this.vl.body(this.active).setContent('')
      this.vl.body(this.active).startEditing()
    },
  },

  edit: {
    help: 'start editing this node at the end',
    active: true,
    action: function () {
      this.vl.body(this.active).startEditing()
    }
  },

  'edit start': {
    help: 'start editing this node at the start',
    active: true,
    action: function () {
      this.vl.body(this.active).startEditing(true)
    },
  },

  // nav
  'first sibling': {
    help: 'jump to the first sibling',
    active: '!new',
    action: function () {
      var first = this.model.firstSibling(this.active)
      if (undefined === first) return
      this.setActive(first)
    }
  },

  'last sibling': {
    help: 'jump to the last sibling',
    active: '!new',
    action: function () {
      var last = this.model.lastSibling(this.active)
      if (undefined === last) return
      this.setActive(last)
    },
  },

  'jump to top': {
    help: 'jump to the top',
    action: function () {
      this.setActive(this.root)
    },
  },

  'jump to bottom': {
    help: 'jump to the last node',
    action: function () {
      this.setActive(this.model.lastOpen(this.root))
      console.log('bottom')
      // pass
    },
  },

  'up': {
    help: 'go to the previous node',
    active: true,
    action: function () {
      var above
      if (this.active === 'new') {
        above = this.root
      } else {
        var top = this.active
        above = this.model.idAbove(top)
        if (above === undefined) above = top
      }
      if (above === this.root && this.o.noSelectRoot) {
        return
      }
      this.setActive(above)
    },
  },

  'down': {
    help: 'go down to the next node',
    active: '!new',
    action: function () {
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

  'left': {
    help: 'go up a level to the parent',
    active: true,
    action: function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var left = this.model.getParent(this.active)
      if (undefined === left) return
      this.setActive(left)
    },
  },

  'right': {
    help: 'go down a level to the first child',
    active: '!now',
    action: function () {
      if (this.active === this.root &&
          !this.model.ids[this.root].children.length) {
        return this.setActive('new')
      }
      var right = this.model.getChild(this.active)
      if (this.model.isCollapsed(this.active)) return
      if (undefined === right) return
      this.setActive(right)
    },
  },

  'next sibling': {
    help: 'jump to the next sibling (skipping children)',
    active: '!new',
    action: function () {
      var sib = this.model.nextSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },
  },

  'prev sibling': {
    help: 'jump to the previous sibling (skipping children)',
    active: '!new',
    action: function () {
      var sib = this.model.prevSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },
  },

  'move to first sibling': {
    help: 'move this node to be the first child if its parent',
    active: '!new',
    action: 'moveToTop'
  },

  'move to last sibling': {
    help: 'move this to be the last child of its parent',
    active: '!new',
    action: 'moveToBottom'
  },

  'new before': {
    help: 'create a node above this one and start editing',
    active: true,
    action: function () {
      this.ctrlactions.addBefore(this.active, '', true)
    }
  },

  'new after': {
    help: 'create a node after this one and start editing',
    active: true,
    action: function () {
      if (this.active === 'new') return this.startEditing()
      this.ctrlactions.addAfter(this.active, '', true)
    },
  },

  // movez!
  'toggle collapse': {
    help: 'toggle collapse',
    active: true,
  },

  'collapse': {
    help: 'collapse the node',
    active: true,
    action: function () {
      this.ctrlactions.toggleCollapse(this.active, true)
    },
  },

  'uncollapse': {
    help: 'expand the node',
    active: true,
    action: function () {
      this.ctrlactions.toggleCollapse(this.active, false)
    }
  },

  'indent': {
    help: 'indent the node',
    active: true,
    action: function () {
      this.ctrlactions.moveRight(this.active)
    },
  },

  'dedent': {
    help: 'dedent the node',
    active: true,
    action: function () {
      this.ctrlactions.moveLeft(this.active)
    },
  },

  'move down': {
    help: 'move the current node down',
    active: true
  },

  'move up': {
    help: 'move the current node up',
    active: true,
  },
}


},{}],16:[function(_dereq_,module,exports){

function merge(a) {
  for (var i=1; i<arguments.length; i++) {
    for (var name in arguments[i]) {
      a[name] = arguments[i][name]
    }
  }
  return a
}

module.exports = Base

function noop() {
  throw new Error("Not implemented!")
}

function Base() {
  this._listeners = {}
}

Base.extend = function (fn, obj) {
  fn.prototype = merge(Object.create(Base.prototype), obj)
  fn.prototype.constructor = fn
}

Base.prototype = {
  init: function (done) {
    done()
  },

  listen: function (type, add, change) {
    // noop
  },

  save: noop,
  update: noop,
  findAll: noop,
  remove: noop,
  load: noop,
  dump: noop,

  removeBatch: function (type, ids) {
    for (var i=0; i<ids.length; i++) {
      this.remove(type, ids[i])
    }
  },

  // event emitter stuff
  emit: function (evt) {
    var args = [].slice.call(arguments, 1)
    if (!this._listeners[evt]) return false
    for (var i=0; i<this._listeners[evt].length; i++) {
      this._listeners[evt][i].apply(this, args)
    }
  },

  on: function (evt, handler) {
    if (!this._listeners[evt]) {
      this._listeners[evt] = []
    }
    this._listeners[evt].push(handler)
  },

  off: function (evt, handler) {
    if (!this._listeners[evt]) return false
    var i = this._listeners[evt].indexOf(handler)
    if (i === -1) return false
    this._listeners[evt].splice(i, 1)
  },
}


},{}],17:[function(_dereq_,module,exports){

var Base = _dereq_('./base')
var uuid = _dereq_('../uuid')

module.exports = FirePL

var COLORS = '#42b9bd #a405fa #7e6c93 #fee901 #a8ff99'.split(' ')
function randColor() {
  return COLORS[parseInt(Math.random() * COLORS.length)]
}

function FirePL(options) {
  Base.call(this)
  this.db = new Firebase(options.url);
  this.data = {}
}

Base.extend(FirePL, {
  init: function (done) {
    var id = uuid();
    this._userid = id
    this.db.once('value', function (snapshot) {
      this.data = snapshot.val()
      var user = this.db.child('users').child(id)
      user.set({selection: false, color: randColor()})
      user.onDisconnect().remove()
      done();
    }.bind(this))

    var users = this.db.child('users')
    users.on('child_added', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('addActive', id, user)
    }.bind(this))

    users.on('child_changed', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('changeActive', id, user)
    }.bind(this))

    users.on('child_removed', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('removeActive', id, user)
    }.bind(this))
  },

  setPresence: function (selection) {
    this.db.child('users').child(this._userid).update({
      // todo usernames
      selection: selection
    })
  },

  listen: function (type, onAdd, onChanged) {
    this.db.child(type).on('child_changed', function (snapshot) {
      var id = snapshot.name()
      var data = snapshot.val()
      this.data[type][id] = data
       onChanged(id, data)
    }.bind(this))

    this.db.child(type).on('child_added', function (snapshot) {
      var id = snapshot.name()
      var data = snapshot.val()
      this.data[type][id] = data
      onAdd(id, data)
    }.bind(this))
  },

  save: function (type, id, data, done) {
    this.data[type][id] = data
    this.db.child(type).child(id).set(data, done)
  },

  update: function (type, id, update, done) {
    this.db.child(type).child(id).update(update, done)
  },

  findAll: function (type, done) {
    this.db.child(type).once('value', function (snapshot) {
      var items = []
      var val = snapshot.val()
      for (var name in val) {
        items.push(val[name])
      }
      done(null, items)
    })
  },

  remove: function (type, id, done) {
    this.db.child(type).child(id).remove(done)
  },

  load: function (data, done, clear) {
  },

  dump: function (done) {
  },
})


},{"../uuid":22,"./base":16}],18:[function(_dereq_,module,exports){

var Base = _dereq_('./base')

module.exports = MemPL

function MemPL() {
  this.data = {}
}

Base.extend(MemPL, {
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
})


},{"./base":16}],19:[function(_dereq_,module,exports){

module.exports = function slideDown(node) {
  var style = window.getComputedStyle(node)
    , height = style.height
  if (!parseInt(height)) {
    return
  }
  var speed = parseInt(height) / 700
  node.style.height = 0
  node.style.transition = 'height ' + speed + 's ease'
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


},{}],20:[function(_dereq_,module,exports){

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
  var speed = parseInt(height) / 700
  node.style.transition = 'height ' + speed + 's ease'
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

},{}],21:[function(_dereq_,module,exports){

module.exports = {
  extend: extend,
  merge: merge,
  ensureInView: ensureInView,
  make_listed: make_listed,
  isMac: isMac,
}

function isMac() {
  return window.navigator.platform.indexOf('Mac') === 0
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


},{}],22:[function(_dereq_,module,exports){

module.exports = uuid

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'
function uuid(ln) {
  ln = ln || 32
  var id = ''
  for (var i=0; i<ln; i++) {
    id += CHARS[parseInt(Math.random() * CHARS.length)]
  }
  return id
}


},{}],23:[function(_dereq_,module,exports){

var keyHandler = _dereq_('./key-handler')
  , normalActions = _dereq_('./normal-actions')
  , visualActions = _dereq_('./visual-actions')
  , util = _dereq_('./util')

module.exports = View

function eqlist(a, b) {
  if (a == b) return true
  if (!a || !b) return false
  if (a.length !== b.length) {
    return false
  }
  for (var i=0; i<a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

var DomViewLayer = _dereq_('./dom-vl')
  , DefaultNode = _dereq_('./default-node')
  , DungeonsAndDragons = _dereq_('./dnd')
  , keys = _dereq_('./keys')
  , util = _dereq_('./util')
  , defaultKeys = _dereq_('./default-keys')

/**
 * The basic view
 *
 * bindActions: fn()
 * model: the model
 * actions: the controller actions
 * options: options hash
 */
function View(bindActions, model, actions, options) {
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
  this.o.keybindings = util.merge(this.getDefaultKeys(), options.keys)
  this.vl = new this.o.ViewLayer(this.o)
  this.bindActions = bindActions
  this.model = model
  this.ctrlactions = actions
  this.modelActions = model.boundActions
  // actually DragAndDrop
  this.dnd = new DungeonsAndDragons(this.vl, actions.move)
  this.lazy_children = {}
  this._listeners = {}

  this.newNode = null
  this.attachListeners()
}

View.prototype = {
  getNode: function () {
    return this.vl.root
  },

  emit: function (evt) {
    var args = [].slice.call(arguments, 1)
    if (!this._listeners[evt]) return false
    for (var i=0; i<this._listeners[evt].length; i++) {
      this._listeners[evt][i].apply(this, args)
    }
  },

  on: function (evt, handler) {
    if (!this._listeners[evt]) {
      this._listeners[evt] = []
    }
    this._listeners[evt].push(handler)
  },

  off: function (evt, handler) {
    if (!this._listeners[evt]) return false
    var i = this._listeners[evt].indexOf(handler)
    if (i === -1) return false
    this._listeners[evt].splice(i, 1)
  },

  getDefaultKeys: function () {
    return util.merge(defaultKeys.view.base,
                      defaultKeys.view[util.isMac() ? 'mac' : 'pc'])
  },

  rebase: function (newroot, trigger) {
    this.vl.clear()
    document.activeElement.blur()
    if (!this.model.ids[newroot]) newroot = this.model.root
    var root = this.vl.root
    this.initialize(newroot)
    this.vl.rebase(root)
    this.ctrlactions.trigger('rebase', newroot)
  },

  initialize: function (root) {
    var node = this.model.ids[root]
      , rootNode = this.vl.makeRoot(node, this.bindActions(root), this.modelActions)
    this.active = null
    this.selection = null
    this.lazy_children = {}
    this.root = root
    this.populateChildren(root)
    if (!node.children.length) {
      this.addNew(this.root, 0)
    } else {
      this.removeNew()
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
    }, this.bindActions('new'), this.modelActions, before)
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

  populateChildren: function (id, node) {
    node = node || this.model.ids[id]
    if (!node) return
    if (node.collapsed && id !== this.root) {
      this.lazy_children[id] = true
      return
    }
    this.lazy_children[id] = false
    this.vl.clearChildren(id)
    if (!node.children || !node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.add(this.model.ids[node.children[i]] || {id: node.children[i], parent: id, content: '', children: []}, false, true)
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

  extra_actions: {},

  keyHandler: function () {
    var normal = keyHandler(
      defaultKeys.view.base,
      normalActions,
      this.ctrlactions
    )

    if (this.extra_actions) {
      for (var action in this.extra_actions) {
        normal[this.extra_actions[action].binding] = this.extra_actions[action].action
      }
    }

    var visual = keyHandler(defaultKeys.visual, visualActions, this.ctrlactions)
    var handlers = {
      'insert': function () {},
      'normal': keys(normal),
      'visual': keys(visual),
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
    this.removeNew()
    this.add(node, before)
    if (!node.children || !node.children.length) return
    for (var i=0; i<node.children.length; i++) {
      this.addTree(this.model.ids[node.children[i]], false)
    }
  },

  // operations
  add: function (node, before, dontfocus) {
    var ed = this.mode === 'insert'
      , children = node.children && !!node.children.length
    if (!this.vl.body(node.parent)) {
      return this.rebase(node.parent, true)
    }
    this.vl.addNew(node, this.bindActions(node.id), this.modelActions, before, children)
    if (!dontfocus) {
      if (ed) {
        this.vl.body(node.id).startEditing()
      } else {
        this.setActive(node.id)
      }
    }
  },

  update: function (id, node) {
    var old = this.model.ids[id] || {}
    console.log('update!', id, node, old)
    var body = this.vl.body(id)
    if (!body) return console.warn('no body for update')
    if (node.content !== old.content) {
      body.setContent(node.content)
    }
    if (!eqlist(node.children, old.children)) {
      this.populateChildren(id, node)
      // TODO handle remote deletion of the active node.
    }
    body.setMeta(node.meta || {})
    // this could get annoying
    if (node.collapsed !== old.collapsed) {
      this.setCollapsed(id, node.collapsed)
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
    if (parent.children.length === 1) {
      if (pid === this.root) {
        setTimeout(function () {
        this.addNew(pid, 0)
        }.bind(this),0)
      }
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

  setAttr: function (id, attr, value, quiet) {
    if (!this.vl.body(id)) {
      if (quiet) return
      return this.rebase(id, true)
    }
    this.vl.body(id).setAttr(attr, value)
    if (this.mode === 'insert' && !quiet) {
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


},{"./default-keys":6,"./default-node":7,"./dnd":8,"./dom-vl":9,"./key-handler":12,"./keys":13,"./normal-actions":15,"./util":21,"./visual-actions":24}],24:[function(_dereq_,module,exports){

function reversed(items) {
  var nw = []
  for (var i=items.length; i>0; i--) {
    nw.push(items[i - 1])
  }
  return nw
}

module.exports = {
  // movement
  'select up': {
    help: 'move the cursor up',
    action: function () {
      var prev = this.model.prevSibling(this.active, true)
      if (!prev) return
      this.addToSelection(prev, true)
    },
  },

  'select down': {
    help: 'move the cursor down',
    action: function () {
      var next = this.model.nextSibling(this.active, true)
      if (!next) return
      this.addToSelection(next, false)
    },
  },

  'select to bottom': {
    help: 'move the cursor to the bottom',
    action: function () {
      var n = this.model.ids[this.selection[0]]
        , ch = this.model.ids[n.parent].children
        , ix = ch.indexOf(this.selection[0])
      this.setSelection(ch.slice(ix))
      this.sel_inverted = false
      this.setActive(ch[ch.length-1])
    },
  },

  'select to top': {
    help: 'move the cursor to the top',
    action: function () {
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
  },

  'stop selecting': {
    help: 'quit selection mode',
    action: function () {
      this.stopSelecting()
    },
  },

  'edit': {
    help: 'start editing the active node',
    action: function () {
      this.startEditing(this.active)
    },
  },

  'edit start': {
    help: 'edit at the start of the node',
    action: function () {
      this.startEditing(this.active, true)
    },
  },

    // editness
  'cut': {
    help: 'cut the current selection',
    action: function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrlactions.cut(items)
      this.stopSelecting()
    },
  },

  'copy': {
    help: 'copy the current selection',
    action: function () {
      var items = this.selection.slice()
      if (this.sel_inverted) {
        items = reversed(items)
      }
      this.ctrlactions.copy(items)
      this.stopSelecting()
    },
  },

  'undo': {
    help: 'undo the last change',
    action: function () {
      this.stopSelecting()
      this.ctrlactions.undo()
    },
  },

  'redo': {
    help: 'redo the last undo',
    action: function () {
      this.stopSelecting()
      this.ctrlactions.redo()
    },
  },
}


},{}],25:[function(_dereq_,module,exports){

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


},{}],26:[function(_dereq_,module,exports){

module.exports = {
  View: _dereq_('./view')
}


},{"./view":27}],27:[function(_dereq_,module,exports){

var DungeonsAndDragons = _dereq_('../../lib/dnd.js')
var Block = _dereq_('./block')

module.exports = View

function View(bindActions, model, actions, options) {
  this.mode = 'normal'
  this.active = null
  this.ids = {}

  this.bindActions = bindActions
  this.model = model
  this.ctrlactions = actions

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
    this.ctrlactions.trigger('rebase', newroot)
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
        this.ctrlactions.changed(node.id, 'whiteboard', config)
        // this.ctrl.executeCommands('changeNodeAttr', [node.id, 'whiteboard', config]);
      }.bind(this),
      saveContent: function (content) {
        this.ctrlactions.changeContent(node.id, content)
      }.bind(this),
      changeContent: function (content) {
        this.ctrlactions.changeContent(node.id, content)
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
    this.ctrlactions.changeContent(this.root, this.input.value)
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
    this.ctrlactions.addChild(this.root, idx, '', {
      whiteboard: {
        // width: 200,
        // height: 200,
        top: y,
        left: x
      }
    })
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
    this.ctrlactions.commands(cmds)
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
      this.ctrlactions.commands('move', [
        this.moving.child,
        this.moving.currentTarget.pid,
        pos
      ], 'changeNodeAttr', [
        this.moving.child,
        'whiteboard',
        null
      ]);
    } else {

      this.ctrlactions.commands('changeNodeAttr', [
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
      this.ctrlactions.commands('move', [
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


},{"../../lib/dnd.js":8,"./block":25}],28:[function(_dereq_,module,exports){

module.exports = {
  addTag: {
    args: ['name'],
    apply: function (view, model) {
      if (!model.hasTagRoot()) {
        var cr = model.addTagRoot()
        this.tagRoot = view.add(cr.node, cr.before, true)
      }
      var nr = model.addTag(this.name)
      view.add(nr.node, nr.before, true)
      this.node = nr.node
      return this.node
    },
    undo: function (view, model) {
      model.remove(this.node.id)
      if (this.tagRoot) {
        model.removeTagRoot()
        view.remove(this.tagRoot.node.id)
      }
    }
  },
  setTags: {
    args: ['id', 'tags'],
    apply: function (view, model) {
      this.oldTags = model.setTags(this.id, this.tags)
      view.setTags(this.id, this.tags, this.oldTags)
    },
    undo: function (view, model) {
      model.setTags(this.id, this.oldTags)
      view.setTags(this.id, this.oldTags, this.tags)
    },
  },
}


},{}],29:[function(_dereq_,module,exports){

var Controller = _dereq_('../../lib/controller')
  , util = _dereq_('../../lib/util')

  , WFNode = _dereq_('./node')
  , WFView = _dereq_('./view')
  , WFVL = _dereq_('./vl')
  , commands = _dereq_('./commands')

module.exports = WFController

function WFController(model, options) {
  options.extra_commands = util.extend(options.extra_commands || {}, commands)
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
    // this.trigger('bullet', this.model.getLineage(id))
  },
  rebase: function (id, toid) {
    this.view.rebase(toid)
  },
  backALevel: function () {
    var root = this.view.root
      , pid = this.model.ids[root].parent
    if (!this.model.ids[pid]) return
    this.actions.clickBullet(pid)
  },
  setTags: function (id, ids) {
    this.executeCommands('setTags', [id, ids])
  },
  addTag: function (id, contents) {
    return this.executeCommands('addTag', [contents])[0];
  },
}, Controller.prototype.actions)


},{"../../lib/controller":5,"../../lib/util":21,"./commands":28,"./node":32,"./view":34,"./vl":35}],30:[function(_dereq_,module,exports){

module.exports = {
  Controller: _dereq_('./controller'),
  Model: _dereq_('./model'),
  Node: _dereq_('./node'),
  View: _dereq_('./view'),
  ViewLayer: _dereq_('./vl'),
}


},{"./controller":29,"./model":31,"./node":32,"./view":34,"./vl":35}],31:[function(_dereq_,module,exports){

var Model = _dereq_('../../lib/model')

module.exports = WFModel

function WFModel() {
  Model.apply(this, arguments)
}

WFModel.prototype = Object.create(Model.prototype)

WFModel.prototype.actions = {
  resolveTags: function (tags) {
    if (!tags) return []
    return tags.map(function (id) {
      return this.ids[id]
    }.bind(this))
  },
  getAllTags: function () {
    var tags = []
    for (var id in this.ids) {
      tags.push(this.ids[id])
    }
    // todo sort by number of references
    return tags
  }
}

WFModel.prototype.hasTagRoot = function () {
  return !!this.rootNode.tagRoot
}

WFModel.prototype.addTagRoot = function () {
  var index = this.ids[this.root].children ? this.ids[this.root].children.length : 0
  var cr = model.create(this.root, index, 'Tags')
  this.rootNode.tagRoot = cr.node.id
  this.db.update('root', this.root, {tagRoot: cr.node.id})
  return cr
}

WFModel.prototype.addTag = function (name) {
  var tagRoot = this.rootNode.tagRoot
  var index = this.ids[tagRoot].children ? this.ids[tagRoot].children.length : 0
  var cr = model.create(tagRoot, index, name)
  return cr
}

WFModel.prototype.readd = function (saved) {
  this.ids[saved.id] = saved.node
  var children = this.ids[saved.node.parent].children
  children.splice(saved.ix, 0, saved.id)
  var before = false
  if (saved.ix < children.length - 1) {
    before = children[saved.ix + 1]
  }

  var upRefs = {}
  var upTags = {}
  var ids = this.ids

  function process(node) {
    for (var i=0; i<node.children.length; i++) {
      process(ids[node.children[i]])
    }

    if (node.meta.tags) {
      node.meta.tags.forEach(function (id) {
        var refs = ids[id].meta.references
        if (!refs) {
          refs = ids[id].meta.references = []
        }
        if (refs.indexOf(node.id) !== -1) return console.warn('duplicate ref on readd')
        refs.push(node.id)
        upRefs[id] = true
      })
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (id) {
        ids[id].meta.tags.push(node.id)
        var tags = ids[id].meta.tags
        if (!tags) {
          tags = ids[id].meta.tags = []
        }
        if (tags.indexOf(node.id) !== -1) return console.warn('duplicate tag on readd')
        tags.push(node.id)
        upTags[id] = true
      })
    }
  }

  process(this.ids[saved.id])

  this.db.save('node', saved.node.id, saved.node)
  this.db.update('node', saved.node.parent, {children: children})

  for (id in upTags) {
    this.db.update('node', id, {tags: this.ids[id].tags})
  }

  for (id in upRefs) {
    this.db.update('node', id, {references: this.ids[id].references})
  }

  return before
}

WFModel.prototype.dumpData = function (id, noids) {
  var data = Model.prototype.dumpData.call(this, id, noids)
  if (!noids) return data
  delete data.meta.references
  delete data.meta.tags
  return data
}

WFModel.prototype.remove = function (id) {
  // remove the references and tags

  if (id === this.root) return
  var n = this.ids[id]
    , p = this.ids[n.parent]
    , ix = p.children.indexOf(id)

  var upRefs = {}
  var upTags = {}
  var ids = this.ids
  var removed = []

  function process(node) {
    if (node.meta.tags) {
      node.meta.tags.forEach(function (id) {
        var refs = ids[id].meta.references
        upRefs[id] = true
        refs.splice(refs.indexOf(node.id), 1)
      })
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (id) {
        var tags = ids[id].meta.tags
        upTags[id] = true
        tags.splice(tags.indexOf(node.id), 1)
      })
    }
    for (var i=0; i<node.children.length; i++) {
      process(ids[node.children[i]])
    }

    delete ids[node.id]
    removed.push(node.id)
  }

  process(n)

  p.children.splice(ix, 1)
  delete this.ids[id]

  setTimeout(function () {
    this.db.removeBatch('node', removed)
    this.db.update('node', n.parent, {children: p.children})


    if (id === this.rootNode.tagRoot) {
      delete this.rootNode.tagRoot
      this.db.update('root', this.root, {tagRoot: null})
    }

    for (id in upTags) {
      if (this.ids[id]) {
        this.db.update('node', id, {tags: this.ids[id].meta.tags})
      }
    }

    for (id in upRefs) {
      if (this.ids[id]) {
        this.db.update('node', id, {references: this.ids[id].meta.references})
      }
    }
  }.bind(this))

  return {id: id, node: n, ix: ix}
}

// TODO should I make references be a dict instead?
WFModel.prototype.setTags = function (id, tags) {
  var old = this.ids[id].meta.tags
  var used = {}
  if (old) old = old.slice()

  // add references
  if (tags) {
    for (var i=0; i<tags.length; i++) {
      used[tags[i]] = true
      var refs = this.ids[tags[i]].meta.references
      if (!refs) {
        refs = this.ids[tags[i]].meta.references = []
      }
      if (refs.indexOf(id) === -1) {
        refs.push(id)
      }
    }
  }

  // remove old references that were removed
  if (old) {
    for (var i=0; i<old.length; i++) {
      if (used[old[i]]) continue;
      var refs = this.ids[old[i]].meta.references
      refs.splice(refs.indexOf(id), 1)
      used[old[i]] = true
    }
  }

  this.ids[id].meta.tags = tags
  // update things
  this.db.update(id, {meta: this.ids[id].meta})
  for (var oid in used) {
    this.db.update(oid, {meta: this.ids[oid].meta})
  }
  return old
}

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


},{"../../lib/model":14}],32:[function(_dereq_,module,exports){

var DefaultNode = _dereq_('../../lib/default-node')
var Tags = _dereq_('./tags')

module.exports = WFNode

function WFNode(content, meta, actions, isNew, modelActions) {
  DefaultNode.call(this, content, meta, actions, isNew, modelActions)
  this.done = meta.done
  this.tags = new Tags(modelActions.resolveTags(meta.tags), actions, modelActions)
  this.node.appendChild(this.tags.node)
  if (meta.done) {
    this.node.classList.add('treed__default-node--done')
  }
}

WFNode.prototype = Object.create(DefaultNode.prototype)
WFNode.prototype.constructor = WFNode

WFNode.prototype.setAttr = function (attr, value) {
  if (attr === 'tags') {
    return this.setTags(value)
  }
  if (attr === 'done') {
    return this.setDone(value)
  }
  DefaultNode.prototype.setAttr.call(this, attr, value)
}

WFNode.prototype.addTag = function (node) {
  this.tags.add(node)
}

WFNode.prototype.removeTag = function (tid) {
  this.tags.removeFull(tid)
}

WFNode.prototype.setTags = function (tags) {
  this.tags.set(this.modelActions.resolveTags(tags))
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


},{"../../lib/default-node":7,"./tags":33}],33:[function(_dereq_,module,exports){

module.exports = Tags

function Tags(tags, actions, modelactions) {
  this.actions = actions
  this.modelactions = modelactions
  this.setupNode()
  this.set(tags)
}

Tags.prototype = {
  setupNode: function () {
    this.node = document.createElement('div')
    this.node.className = 'treed_tags'

    this.handle = document.createElement('div')
    this.handle.className = 'treed_tags_handle'
    this.handle.addEventListener('click', this.startEditing.bind(this))
    this.handle.innerHTML = '<i class="fa fa-tag"/>'

    this.tags = document.createElement('div')
    this.tags.className = 'treed_tags_list'

    this.editor = document.createElement('div')
    this.editor.className = 'treed_tags_editor'

    this.input = document.createElement('input')
    this.input.className = 'treed_tags_input'

    this.input.addEventListener('keydown', this.keyDown.bind(this))
    this.input.addEventListener('keyup', this.keyUp.bind(this))
    this.input.addEventListener('blur', this.onBlur.bind(this))

    this.resultsNode = document.createElement('ul')
    this.resultsNode.className = 'treed_tags_results'
    this.tags.addEventListener('mousedown', function (e) {e.preventDefault()})
    this.resultsNode.addEventListener('mousedown', function (e) {e.preventDefault()})

    this.newNode = document.createElement('div')
    this.newNode.className = 'treed_tags_new'
    this.newNode.addEventListener('mousedown', function (e) {e.preventDefault()})
    this.newNode.addEventListener('click', this.onNew.bind(this))
    this.newNode.innerText = 'Create new tag'

    this.node.appendChild(this.tags)
    this.node.appendChild(this.handle)
    this.node.appendChild(this.editor)

    this.editor.appendChild(this.input)
    this.editor.appendChild(this.resultsNode)
    this.editor.appendChild(this.newNode)

    this.dom = {}
  },

  startEditing: function (e) {
    if (this.editing) return
    this.actions.setActive()
    this.editing = true
    this.node.classList.add('treed_tags--open')
    this.fullResults = this.modelactions.getAllTags()
    this.filterBy('')
    this.selection = 0
    this.input.value = ''
    this.input.focus()
    this.showResults()
    // todo show everything first? I think I'll wait for first key change
  },

  doneEditing: function (e) {
    if (!this.editing) return
    this.editing = false
    this.node.classList.remove('treed_tags--open')
    this.actions.setTags(this.value.map(function (x){ return x.id }))
  },

  onBlur: function () {
    this.doneEditing()
  },

  keys: {
    27: function (e) { // escape
      e.preventDefault()
      this.doneEditing()
    },
    9: function (e) { // tab
      e.preventDefault()
      this.addCurrent()
    },
    13: function (e) { // return
      e.preventDefault()
      this.addCurrent()
      this.doneEditing()
    },
    8: function (e) { // backspace
      if (!this.input.value) {
        e.preventDefault()
        this.removeLast()
      }
    },
  },

  keyDown: function (e) {
    var action = this.keys[e.keyCode]
    if (action) return action.call(this, e)
  },

  keyUp: function (e) {
    this.filterBy(this.input.value)
    this.showResults()
  },

  filterBy: function (needle) {
    var used = {}
    for (var i=0; i<this.value.length; i++) {
      used[this.value[i].id] = true
    }
    if (!needle) {
      this.results = this.fullResults.filter(function (tag) {
        return !used[tag.id]
      })
    } else {
      needle = needle.toLowerCase()
      this.results = this.fullResults.filter(function (tag) {
        return !used[tag.id] && tag.content.toLowerCase().indexOf(needle) !== -1
      })
    }
  },

  showResults: function () {
    while (this.resultsNode.lastChild) {
      this.resultsNode.removeChild(this.resultsNode.lastChild)
    }
    var num = 5
    if (num > this.results.length) num = this.results.length
    var click = function (tag, e) {
      e.preventDefault()
      this.addCurrent(tag)
    }
    for (var i=0; i<num; i++) {
      var node = document.createElement('li')
      node.innerText = this.results[i].content
      node.className = 'treed_tags_result'
      node.addEventListener('click', click.bind(this, this.results[i]))
      this.resultsNode.appendChild(node)
    }
  },

  onNew: function () {
    if (!this.input.value.length) return
    var tag = this.actions.addTag(this.input.value)
    this.addCurrent(tag)
  },

  addCurrent: function (tag) {
    if (!tag) {
      if (!this.input.value.length) return
      if (!this.results.length) {
        tag = this.actions.addTag(this.input.value)
      } else {
        tag = this.results[this.selection]
      }
    }
    if (this.value.indexOf(tag) !== -1) return this.resetSearch()
    this.value.push(tag)
    this.add(tag)
    this.resetSearch()
  },

  resetSearch: function () {
    this.input.value = ''
    this.filterBy('')
    this.selection = 0
    this.showResults()
  },

  removeLast: function () {
    if (!this.value.length) return
    var last = this.value.pop()
    this.remove(last.id)
    this.resetSearch()
  },

  remove: function (id) {
    this.tags.removeChild(this.dom[id])
    delete this.dom[id]
  },

  removeFull: function (id) {
    for (var i=0; i<this.value.length; i++) {
      if (this.value[i].id === id) {
        this.value.splice(i, 1)
        this.remove(id)
        this.resetSearch()
        return
      }
    }
  },

  set: function (tags) {
    this.value = tags || []
    while (this.tags.lastChild) this.tags.removeChild(this.tags.lastChild)
    this.dom = {}
    this.value.map(this.add.bind(this))
  },

  add: function (tag) {
    if (this.dom[tag.id]) return console.warn('tried to add duplicate tag')
    var node = document.createElement('div')
    this.dom[tag.id] = node
    node.className = 'treed_tag'

    var content = document.createElement('span')
    content.innerText = tag.content
    node.appendChild(content)

    var remove = document.createElement('span')
    remove.className = 'treed_tag_remove'
    remove.innerHTML = ' &times;'
    var rmFunc = this.removeFull.bind(this, tag.id)
    remove.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      rmFunc()
    })

    node.appendChild(remove)

    node.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (this.editing) return
      this.actions.rebase(tag.id)
    }.bind(this))
    this.tags.appendChild(node)
  },
}


},{}],34:[function(_dereq_,module,exports){

var View = _dereq_('../../lib/view')

module.exports = WFView

function WFView() {
  View.apply(this, arguments)
}

WFView.prototype = Object.create(View.prototype)

WFView.prototype.initialize = function (root) {
  var rootNode = View.prototype.initialize.call(this, root)
    , node = this.model.ids[root]
  if (node.meta.references) {
    this.vl.setReferences(node.meta.references.map(function (id) {
      return this.model.ids[id]
    }.bind(this)), this.rebase.bind(this))
  }
  return rootNode
}

WFView.prototype.addTree = function (node, before) {
  if (!this.vl.body(node.parent)) {
    return this.rebase(node.parent, true)
  }
  this.add(node, before)

  if (node.meta.tags) {
    node.meta.tags.forEach(function (id) {
      if (id === this.root) {
        this.vl.addReference(this.model.ids[node.id], this.rebase.bind(this, node.id))
      }
    }.bind(this))
  }

  if (node.meta.references) {
    node.meta.references.forEach(function (id) {
      this.vl.addTag(id, node)
    }.bind(this))
  }

  if (!node.children || !node.children.length) return
  for (var i=0; i<node.children.length; i++) {
    this.addTree(this.model.ids[node.children[i]], false)
  }
}

WFView.prototype.remove = function (id, ignoreActive) {
  var node = this.model.ids[id]
    , pid = node.parent
    , parent = this.model.ids[pid]

  if (!this.vl.body(id)) {
    return this.rebase(pid, true)
  }
  if (id === this.active && !ignoreActive) {
    this.setActive(this.root)
  }

  this.vl.remove(id, pid, parent && parent.children.length === 1)
  if (parent.children.length === 1) {
    if (pid === this.root) {
      setTimeout(function () {
      this.addNew(pid, 0)
      }.bind(this),0)
    }
  }

  // remove the references and tags

  var ids = this.model.ids

  function process(node) {
    for (var i=0; i<node.children.length; i++) {
      process.call(this, ids[node.children[i]])
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (rid) {
        this.vl.removeTag(rid, node.id)
      }.bind(this))
    }

    if (node.meta.tags) {
      node.meta.tags.forEach(function (tid) {
        this.vl.removeReference(tid, node.id)
      }.bind(this))
    }
  }

  process.call(this, node)
}

WFView.prototype.setAttr = function (id, attr, value, quiet) {
  var res = View.prototype.setAttr.apply(this, arguments)
  if (attr !== 'references') return res
  if (id !== this.root) return
  this.vl.setReferences(value && value.map(function (id) {
    return this.model.ids[id]
  }.bind(this)), this.rebase.bind(this))
  return res
}

WFView.prototype.setTags = function (id, tags, oldTags) {
  var used = {}
  for (var i=0; i<tags.length; i++) {
    used[tags[i]] = true
  }
  this.setAttr(id, 'tags', tags)
  for (var i=0; i<tags.length; i++) {
    this.setAttr(tags[i], 'references', this.model.ids[tags[i]].meta.references, true)
  }
  if (oldTags) {
    for (var i=0; i<oldTags.length; i++) {
      if (used[oldTags[i]]) continue;
      this.setAttr(oldTags[i], 'references', this.model.ids[oldTags[i]].meta.references, true)
    }
  }
}

WFView.prototype.extra_actions = {
  'edit tags': {
    binding: 'shift+3',
    action: function () {
      this.vl.editTags(this.active)
    },
  },
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.ctrlactions.clickBullet(this.active)
    }
  },
  'back a level': {
    binding: 'shift+alt+return',
    action: function () {
      this.ctrlactions.backALevel()
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
      this.ctrlactions.changed(this.active, 'done', done)
      if (done) {
        this.goTo(next)
      }
    }
  }
}


},{"../../lib/view":23}],35:[function(_dereq_,module,exports){

var DomViewLayer = _dereq_('../../lib/dom-vl')

module.exports = WFVL

function WFVL() {
  DomViewLayer.apply(this, arguments)
}

WFVL.prototype = Object.create(DomViewLayer.prototype)

WFVL.prototype.removeTag = function (id, tid) {
  var body = this.body(id)
  if (!body) return
  body.removeTag(tid)
}

WFVL.prototype.addTag = function (id, node) {
  var body = this.body(id)
  if (!body) return
  body.addTag(node)
}

WFVL.prototype.editTags = function (id) {
  this.body(id).tags.startEditing()
}

WFVL.prototype.makeHead = function (body, actions) {
  var head = DomViewLayer.prototype.makeHead.call(this, body, actions)
    , bullet = document.createElement('div')
  bullet.classList.add('treed__bullet')
  bullet.addEventListener('mousedown', actions.clickBullet)
  head.insertBefore(bullet, head.childNodes[1])
  return head
}

WFVL.prototype.makeRoot = function (node, bounds, modelActions) {
  var root = DomViewLayer.prototype.makeRoot.call(this, node, bounds, modelActions)
  var refContainer = document.createElement('div')
  refContainer.className = 'treed_references'
  refContainer.innerHTML = '<h1 class="treed_references_title">References</h1>'
  this.references = document.createElement('div')
  this.references.className = 'treed_references_list'
  this.rfs = {}
  refContainer.appendChild(this.references)
  root.appendChild(refContainer)
  this.refContainer = refContainer
  return root
}

WFVL.prototype.setReferences = function (nodes, action) {
  this.clearReferences()
  if (!nodes || !nodes.length) {
    this.refContainer.classList.remove('treed_references--shown')
    return
  }
  this.refContainer.classList.add('treed_references--shown')
  nodes.forEach(function (node) {
    this.addReference(node, action.bind(null, node.id))
  }.bind(this))
}

WFVL.prototype.clearReferences = function () {
  while (this.references.lastChild) {
    this.references.removeChild(this.references.lastChild)
  }
  this.rfs = {}
}

WFVL.prototype.addReference = function (node, action) {
  this.refContainer.classList.add('treed_references--shown')
  var div = document.createElement('div')
  div.className = 'treed_reference'
  div.innerHTML = marked(node.content)
  div.addEventListener('click', action)
  this.rfs[node.id] = div
  this.references.appendChild(div)
}

WFVL.prototype.removeReference = function (id, rid) {
  // TODO fill this in
}


},{"../../lib/dom-vl":9}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2RlbW8vdHBsL2RlbW8uanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2Jhc2Utbm9kZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvY29tbWFuZGVnZXIuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2NvbW1hbmRzLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9jb250cm9sbGVyLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9kZWZhdWx0LWtleXMuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2RlZmF1bHQtbm9kZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvZG5kLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9kb20tdmwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2Ryb3Atc2hhZG93LmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIva2V5LWhhbmRsZXIuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL2tleXMuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL21vZGVsLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL2xpYi9ub3JtYWwtYWN0aW9ucy5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvcGwvYmFzZS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvcGwvZmlyZWJhc2UuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3BsL21lbS5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvc2xpZGUtZG93bi5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9saWIvc2xpZGUtdXAuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3V0aWwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3V1aWQuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3ZpZXcuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvbGliL3Zpc3VhbC1hY3Rpb25zLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL3NraW5zL3doaXRlYm9hcmQvYmxvY2suanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd2hpdGVib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93aGl0ZWJvYXJkL3ZpZXcuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L2NvbW1hbmRzLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL3NraW5zL3dvcmtmbG93eS9jb250cm9sbGVyLmpzIiwiL1VzZXJzL2toYW5pbnRlcm4xL2Nsb25lL3RyZWVkL3NraW5zL3dvcmtmbG93eS9pbmRleC5qcyIsIi9Vc2Vycy9raGFuaW50ZXJuMS9jbG9uZS90cmVlZC9za2lucy93b3JrZmxvd3kvbW9kZWwuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L25vZGUuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L3RhZ3MuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L3ZpZXcuanMiLCIvVXNlcnMva2hhbmludGVybjEvY2xvbmUvdHJlZWQvc2tpbnMvd29ya2Zsb3d5L3ZsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIG5tID0gcmVxdWlyZSgnLi4vLi4vbGliJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJ1bjogcnVuRGVtbyxcbiAgcHJlbG9hZDogcHJlbG9hZCxcbiAgc2tpbnM6IHtcbiAgICB3ZjogcmVxdWlyZSgnLi4vLi4vc2tpbnMvd29ya2Zsb3d5JyksXG4gICAgd2I6IHJlcXVpcmUoJy4uLy4uL3NraW5zL3doaXRlYm9hcmQnKVxuICB9LFxuICBwbDoge1xuICAgIE1lbTogcmVxdWlyZSgnLi4vLi4vbGliL3BsL21lbScpLFxuICAgIEZpcmViYXNlOiByZXF1aXJlKCcuLi8uLi9saWIvcGwvZmlyZWJhc2UnKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1lcmdlKGEsIGIpIHtcbiAgZm9yICh2YXIgYyBpbiBiKSB7XG4gICAgYVtjXSA9IGJbY11cbiAgfVxuICByZXR1cm4gYVxufVxuXG5mdW5jdGlvbiBwcmVsb2FkKHNjcmlwdHMsIGNiKSB7XG4gIHZhciB3YWl0aW5nID0gMFxuICBzY3JpcHRzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB3YWl0aW5nICs9IDFcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgbm9kZS5zcmMgPSBuYW1lXG4gICAgdmFyIGRvbmUgPSBmYWxzZVxuICAgIG5vZGUub25sb2FkID0gbm9kZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoZG9uZSB8fCAodGhpcy5yZWFkeVN0YXRlICYmIHRoaXMucmVhZHlTdGF0ZSAhPT0gJ2xvYWRlZCcgJiYgdGhpcy5yZWFkeVN0YXRlICE9PSAnY29tcGxldGUnKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGRvbmUgPSB0cnVlXG4gICAgICBub2RlLm9ubG9hZCA9IG5vZGUub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbFxuICAgICAgd2FpdGluZyAtPSAxXG4gICAgICBpZiAoIXdhaXRpbmcpIHtcbiAgICAgICAgY2IoKVxuICAgICAgfVxuICAgIH1cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHJ1bkRlbW8ob3B0aW9ucywgZG9uZSkge1xuICB2YXIgbyA9IG1lcmdlKHtcbiAgICBub1RpdGxlOiBmYWxzZSxcbiAgICB0aXRsZTogJ1RyZWVkIEV4YW1wbGUnLFxuICAgIGVsOiAnZXhhbXBsZScsXG4gICAgTW9kZWw6IG5tLk1vZGVsLFxuICAgIENvbnRyb2xsZXI6IG5tLkNvbnRyb2xsZXIsXG4gICAgVmlldzogbm0uVmlldyxcbiAgICB2aWV3T3B0aW9uczoge1xuICAgICAgVmlld0xheWVyOiBubS5WaWV3TGF5ZXIsXG4gICAgICBOb2RlOiBubS5Ob2RlXG4gICAgfSxcbiAgICBzdHlsZTogW10sXG4gICAgZGF0YTogZGVtb0RhdGEsXG4gICAgY3RybE9wdGlvbnM6IHt9LFxuICAgIGluaXREQjogZnVuY3Rpb24gKCkge30sXG4gIH0sIG9wdGlvbnMpXG5cbiAgaWYgKCFvLm5vVGl0bGUpIHtcbiAgICBkb2N1bWVudC50aXRsZSA9IG8udGl0bGVcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKS50ZXh0Q29udGVudCA9IG8udGl0bGVcbiAgfVxuXG4gIG8uc3R5bGUuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBzdHlsZS5yZWwgPSAnc3R5bGVzaGVldCdcbiAgICBzdHlsZS5ocmVmID0gbmFtZVxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICB9KTtcblxuICB2YXIgZGIgPSBvLnBsIHx8IG5ldyBtb2R1bGUuZXhwb3J0cy5wbC5NZW0oe30pO1xuXG4gIGRiLmluaXQoZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBsb2FkRmFpbGVkKGVycik7XG4gICAgfVxuXG4gICAgaW5pdERCKGRiLCBmdW5jdGlvbiAoZXJyLCByb290LCBtYXAsIHdhc0VtcHR5KSB7XG5cbiAgICAgIHdpbmRvdy5tb2RlbCA9IG5ldyBvLk1vZGVsKHJvb3QsIG1hcCwgZGIpXG4gICAgICB3aW5kb3cuY3RybCA9IHdpbmRvdy5jb250cm9sbGVyID0gbmV3IG8uQ29udHJvbGxlcihtb2RlbCwgby5jdHJsT3B0aW9ucylcbiAgICAgIHdpbmRvdy52aWV3ID0gd2luZG93LnZpZXcgPSBjdHJsLnNldFZpZXcoXG4gICAgICAgIG8uVmlldyxcbiAgICAgICAgby52aWV3T3B0aW9uc1xuICAgICAgKTtcbiAgICAgIGlmICh3YXNFbXB0eSkge1xuICAgICAgICBmb3IgKHZhciBpPTA7aTxvLmRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjdHJsLmltcG9ydERhdGEoby5kYXRhLmNoaWxkcmVuW2ldLCByb290LmlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbml0REIpIG9wdGlvbnMuaW5pdERCKHdpbmRvdy5tb2RlbClcbiAgICAgICAgd2luZG93LnZpZXcucmViYXNlKHJvb3QuaWQpO1xuICAgICAgfVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoby5lbCkuYXBwZW5kQ2hpbGQodmlldy5nZXROb2RlKCkpO1xuXG4gICAgICBkb25lICYmIGRvbmUod2luZG93Lm1vZGVsLCB3aW5kb3cuY3RybCwgd2luZG93LnZpZXcsIGRiKVxuXG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0REIoZGIsIGRvbmUpIHtcbiAgZGIuZmluZEFsbCgncm9vdCcsIGZ1bmN0aW9uIChlcnIsIHJvb3RzKSB7XG4gICAgaWYgKGVycikgcmV0dXJuIGRvbmUoZXJyKVxuXG4gICAgaWYgKCFyb290cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBsb2FkRGVmYXVsdChkYiwgZG9uZSlcbiAgICB9XG5cbiAgICBkYi5maW5kQWxsKCdub2RlJywgZnVuY3Rpb24gKGVyciwgbm9kZXMpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBkb25lKG5ldyBFcnJvcignRmFpbGVkIHRvIGxvYWQgaXRlbXMnKSlcbiAgICAgIGlmICghbm9kZXMubGVuZ3RoKSByZXR1cm4gZG9uZShuZXcgRXJyb3IoXCJEYXRhIGNvcnJ1cHRlZCAtIGNvdWxkIG5vdCBmaW5kIHJvb3Qgbm9kZVwiKSlcblxuICAgICAgdmFyIG1hcCA9IHt9XG4gICAgICBmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWFwW25vZGVzW2ldLmlkXSA9IG5vZGVzW2ldXG4gICAgICB9XG4gICAgICBkb25lKG51bGwsIHJvb3RzWzBdLCBtYXAsIGZhbHNlKVxuICAgIH0pXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGxvYWREZWZhdWx0KGRiLCBkb25lKSB7XG4gIHZhciBST09UX0lEID0gNTBcblxuICAvLyBsb2FkIGRlZmF1bHRcbiAgZGIuc2F2ZSgncm9vdCcsIFJPT1RfSUQsIHtpZDogUk9PVF9JRH0sIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWFwID0ge31cbiAgICBtYXBbUk9PVF9JRF0gPSB7XG4gICAgICBpZDogUk9PVF9JRCxcbiAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICBjb250ZW50OiBcIkhvbWVcIixcbiAgICAgIG1ldGE6IHt9LFxuICAgICAgZGVwdGg6IDBcbiAgICB9XG5cbiAgICBkYi5zYXZlKCdub2RlJywgUk9PVF9JRCwgbWFwW1JPT1RfSURdLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkb25lKG51bGwsIHtpZDogUk9PVF9JRH0sIG1hcCwgdHJ1ZSlcbiAgICB9KVxuICB9KVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gQmFzZU5vZGVcblxudmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMnKVxuICAsIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxuXG5mdW5jdGlvbiBCYXNlTm9kZShjb250ZW50LCBtZXRhLCBvcHRpb25zLCBpc05ldywgbW9kZWxBY3Rpb25zKSB7XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnQgfHwgJydcbiAgdGhpcy5pc05ldyA9IGlzTmV3XG4gIHRoaXMubW9kZWxBY3Rpb25zID0gbW9kZWxBY3Rpb25zXG4gIHRoaXMubyA9IG9wdGlvbnNcbiAgdGhpcy5vLmtleWJpbmRpbmdzID0gdXRpbC5tZXJnZSh0aGlzLmRlZmF1bHRfa2V5cywgb3B0aW9ucy5rZXlzKVxuXG4gIHRoaXMuZWRpdGluZyA9IGZhbHNlXG4gIHRoaXMuc2V0dXBOb2RlKCk7XG59XG5cbkJhc2VOb2RlLmFkZEFjdGlvbiA9IGZ1bmN0aW9uIChhY3Rpb24sIGJpbmRpbmcsIGZ1bmMpIHtcbiAgaWYgKCF0aGlzLmV4dHJhX2FjdGlvbnMpIHtcbiAgICB0aGlzLmV4dHJhX2FjdGlvbnMgPSB7fVxuICB9XG4gIHRoaXMuZXh0cmFfYWN0aW9uc1thY3Rpb25dID0ge1xuICAgIGJpbmRpbmc6IGJpbmRpbmcsXG4gICAgZnVuYzogZnVuY1xuICB9XG59XG5cbkJhc2VOb2RlLnByb3RvdHlwZSA9IHtcbiAgLy8gcHVibGljXG4gIHN0YXJ0RWRpdGluZzogZnVuY3Rpb24gKGZyb21TdGFydCkge1xuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgYWRkRWRpdFRleHQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIH0sXG5cbiAgc2V0TWV0YTogZnVuY3Rpb24gKG1ldGEpIHtcbiAgfSxcblxuICBzZXRBdHRyOiBmdW5jdGlvbiAoYXR0ciwgdmFsdWUpIHtcbiAgfSxcblxuICAvLyBwcm90ZXh0ZWRcbiAgaXNBdFN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgaXNBdEVuZDogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIGlzQXRCb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgfSxcblxuICBpc0F0VG9wOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgc2V0dXBOb2RlOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG5cbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gIH0sXG5cbiAgZ2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgfSxcblxuICBnZXRTZWxlY3Rpb25Qb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICB9LFxuXG4gIC8vIFNob3VsZCB0aGVyZSBiZSBhIGNhblN0b3BFZGl0aW5nP1xuICBmb2N1czogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhcnRFZGl0aW5nKCk7XG4gIH0sXG5cbiAgYmx1cjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RvcEVkaXRpbmcoKTtcbiAgfSxcblxuICBrZXlIYW5kbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjdGlvbnMgPSB7fVxuICAgICAgLCBhY3Rpb25cbiAgICBmb3IgKGFjdGlvbiBpbiB0aGlzLm8ua2V5YmluZGluZ3MpIHtcbiAgICAgIGFjdGlvbnNbdGhpcy5vLmtleWJpbmRpbmdzW2FjdGlvbl1dID0gdGhpcy5hY3Rpb25zW2FjdGlvbl1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5leHRyYV9hY3Rpb25zKSB7XG4gICAgICBmb3IgKGFjdGlvbiBpbiB0aGlzLmV4dHJhX2FjdGlvbnMpIHtcbiAgICAgICAgaWYgKCFhY3Rpb25zW2FjdGlvbl0pIHtcbiAgICAgICAgICBhY3Rpb25zW3RoaXMuZXh0cmFfYWN0aW9uc1thY3Rpb25dLmJpbmRpbmddID0gdGhpcy5leHRyYV9hY3Rpb25zW2FjdGlvbl0uYWN0aW9uXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cyhhY3Rpb25zKS5iaW5kKHRoaXMpXG4gIH0sXG5cbiAgZGVmYXVsdF9rZXlzOiB7XG4gICAgJ3VuZG8nOiAnY3RybCt6JyxcbiAgICAncmVkbyc6ICdjdHJsK3NoaWZ0K3onLFxuICAgICdjb2xsYXBzZSc6ICdhbHQrbGVmdCcsXG4gICAgJ3VuY29sbGFwc2UnOiAnYWx0K3JpZ2h0JyxcbiAgICAnZGVkZW50JzogJ3NoaWZ0K3RhYiwgc2hpZnQrYWx0K2xlZnQnLFxuICAgICdpbmRlbnQnOiAndGFiLCBzaGlmdCthbHQrcmlnaHQnLFxuICAgICdtb3ZlIHVwJzogJ3NoaWZ0K2FsdCt1cCcsXG4gICAgJ21vdmUgZG93bic6ICdzaGlmdCthbHQrZG93bicsXG4gICAgJ3VwJzogJ3VwJyxcbiAgICAnZG93bic6ICdkb3duJyxcbiAgICAnbGVmdCc6ICdsZWZ0JyxcbiAgICAncmlnaHQnOiAncmlnaHQnLFxuICAgICdhZGQgYWZ0ZXInOiAncmV0dXJuJyxcbiAgICAnaW5zZXJ0IHJldHVybic6ICdzaGlmdCtyZXR1cm4nLFxuICAgICdtZXJnZSB1cCc6ICdiYWNrc3BhY2UnLFxuICAgICdzdG9wIGVkaXRpbmcnOiAnZXNjYXBlJyxcbiAgfSxcblxuICBhY3Rpb25zOiB7XG4gICAgJ3VuZG8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udW5kbygpXG4gICAgfSxcblxuICAgICdyZWRvJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLnJlZG8oKVxuICAgIH0sXG5cbiAgICAnY29sbGFwc2UnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udG9nZ2xlQ29sbGFwc2UodHJ1ZSlcbiAgICB9LFxuXG4gICAgJ3VuY29sbGFwc2UnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8udG9nZ2xlQ29sbGFwc2UoZmFsc2UpXG4gICAgfSxcblxuICAgICdkZWRlbnQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8ubW92ZUxlZnQoKVxuICAgIH0sXG5cbiAgICAnaW5kZW50JzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLm1vdmVSaWdodCgpXG4gICAgfSxcblxuICAgICdtb3ZlIHVwJzogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5vLm1vdmVVcCgpXG4gICAgfSxcblxuICAgICdtb3ZlIGRvd24nOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8ubW92ZURvd24oKVxuICAgIH0sXG5cbiAgICAndXAnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5pc0F0VG9wKCkpIHtcbiAgICAgICAgdGhpcy5vLmdvVXAoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSxcblxuICAgICdkb3duJzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuaXNBdEJvdHRvbSgpKSB7XG4gICAgICAgIHRoaXMuby5nb0Rvd24oKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgJ2xlZnQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5pc0F0U3RhcnQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vLmdvVXAoKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgJ3JpZ2h0JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuaXNBdEVuZCgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm8uZ29Eb3duKHRydWUpXG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnaW5zZXJ0IHJldHVybic6IGZ1bmN0aW9uIChlKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnYWRkIGFmdGVyJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNzID0gdGhpcy5nZXRTZWxlY3Rpb25Qb3NpdGlvbigpXG4gICAgICAgICwgY29udGVudCA9IHRoaXMuZ2V0VmlzaWJsZVZhbHVlKClcbiAgICAgICAgLCByZXN0ID0gbnVsbFxuICAgICAgaWYgKHRoaXMuaXNNdWx0aUxpbmUoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgdmFyIHJlc3QgPSB0aGlzLnNwbGl0UmlnaHRPZkN1cnNvcigpXG4gICAgICBpZiAoIXRoaXMuaXNOZXcpIHtcbiAgICAgICAgdGhpcy5zdG9wRWRpdGluZygpXG4gICAgICB9XG4gICAgICB0aGlzLm8uYWRkQWZ0ZXIocmVzdCwgdHJ1ZSlcbiAgICB9LFxuXG4gICAgLy8gb24gYmFja3NwYWNlXG4gICAgJ21lcmdlIHVwJzogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHZhbHVlID0gdGhpcy5nZXRJbnB1dFZhbHVlKClcbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuby5yZW1vdmUoKVxuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlMaW5lKCkgJiYgdGhpcy5pc0F0U3RhcnQoKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5vLnJlbW92ZSh2YWx1ZSlcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSxcblxuICAgICdzdG9wIGVkaXRpbmcnOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0b3BFZGl0aW5nKCk7XG4gICAgfVxuICB9LFxufVxuXG4iLCJcbnZhciBjb21tYW5kcyA9IHJlcXVpcmUoJy4vY29tbWFuZHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRlZ2VyXG5cbmZ1bmN0aW9uIG1ha2VDb21tYW5kKHR5cGUsIGFyZ3MsIGNvbW1hbmRzKSB7XG4gIHZhciBuYW1lcyA9IGNvbW1hbmRzW3R5cGVdLmFyZ3NcbiAgICAsIGRhdGEgPSB7fVxuICBmb3IgKHZhciBpPTA7IGk8bmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBkYXRhW25hbWVzW2ldXSA9IGFyZ3NbaV1cbiAgfVxuICByZXR1cm4ge3R5cGU6IHR5cGUsIGRhdGE6IGRhdGF9XG59XG5cbi8qKlxuICogTWFuYWdlcyB0aGUgZXhlY3V0aW9uIG9mIGNvbW1hbmRzLlxuICovXG5mdW5jdGlvbiBDb21tYW5kZWdlcihtb2RlbCwgZXh0cmFfY29tbWFuZHMpIHtcbiAgdGhpcy5oaXN0b3J5ID0gW11cbiAgdGhpcy5oaXN0cG9zID0gMFxuICB0aGlzLnZpZXcgPSBudWxsXG4gIHRoaXMubGlzdGVuZXJzID0ge31cbiAgdGhpcy53b3JraW5nID0gZmFsc2VcbiAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gIHRoaXMuY29tbWFuZHMgPSBjb21tYW5kc1xuICBpZiAoZXh0cmFfY29tbWFuZHMpIHtcbiAgICBmb3IgKHZhciBuYW1lIGluIGV4dHJhX2NvbW1hbmRzKSB7XG4gICAgICB0aGlzLmNvbW1hbmRzW25hbWVdID0gZXh0cmFfY29tbWFuZHNbbmFtZV1cbiAgICB9XG4gIH1cbn1cblxuQ29tbWFuZGVnZXIucHJvdG90eXBlID0ge1xuICAvKipcbiAgICogRXhlY3V0ZSBvbmUgb3IgbW9yZSBjb21tZW50cy5cbiAgICpcbiAgICogVXNhZ2U6XG4gICAqXG4gICAqIC0gZXhlY3V0ZUNvbW1hbmRzKCdjbWR0eXBlJywgW2FyZ3MsIGV0Y10pXG4gICAqIC0gZXhlY3V0ZUNvbW1hbmRzKCdjbWR0eXBlJywgW2FyZ3MsIGV0Y10sICdub3RoZXInLCBbbW9yZSwgYXJnc10pXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIHRoZSBjb21tYW5kIHRvIGV4ZWN1dGVcbiAgICogQHBhcmFtIHtsaXN0fSBhcmdzIGEgbGlzdCBvZiBhcmdzIHRvIHBhc3MgdG8gdGhlIGNvbW1lbnRcbiAgICovXG4gIGV4ZWN1dGVDb21tYW5kczogZnVuY3Rpb24gKHR5cGUsIGFyZ3MpIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSByZXR1cm5cbiAgICB2YXIgY21kcyA9IFtdO1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIGlcbiAgICBmb3IgKGk9MDsgaTxhcmd1bWVudHMubGVuZ3RoOyBpKz0yKSB7XG4gICAgICBjbWRzLnB1c2gobWFrZUNvbW1hbmQoYXJndW1lbnRzW2ldLCBhcmd1bWVudHNbaSsxXSwgdGhpcy5jb21tYW5kcykpXG4gICAgfVxuICAgIGlmICh0aGlzLmhpc3Rwb3MgPiAwKSB7XG4gICAgICB0aGlzLmhpc3RvcnkgPSB0aGlzLmhpc3Rvcnkuc2xpY2UoMCwgLXRoaXMuaGlzdHBvcylcbiAgICAgIHRoaXMuaGlzdHBvcyA9IDBcbiAgICB9XG4gICAgdGhpcy5oaXN0b3J5LnB1c2goY21kcylcbiAgICBmb3IgKGk9MDsgaTxjbWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzLnB1c2godGhpcy5kb0NvbW1hbmQoY21kc1tpXSkpXG4gICAgfVxuICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJylcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9LFxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGFuIGV2ZW50IG9uIGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2hhdCB0aGUgZXZlbnQgdG8gdHJpZ2dlclxuICAgKi9cbiAgdHJpZ2dlcjogZnVuY3Rpb24gKHdoYXQpIHtcbiAgICB2YXIgcmVzdCA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgIGZvciAodmFyIGl0ZW0gaW4gdGhpcy5saXN0ZW5lcnNbd2hhdF0pIHtcbiAgICAgIHRoaXMubGlzdGVuZXJzW3doYXRdW2l0ZW1dLmFwcGx5KG51bGwsIHJlc3QpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGxpc3RlbmVyIGZvciBhbiBldmVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2hhdCB0aGUgZXZlbnQgdHlwZVxuICAgKiBAcGFyYW0ge2ZufSBjYiB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgKi9cbiAgb246IGZ1bmN0aW9uICh3aGF0LCBjYikge1xuICAgIGlmICghdGhpcy5saXN0ZW5lcnNbd2hhdF0pIHtcbiAgICAgIHRoaXMubGlzdGVuZXJzW3doYXRdID0gW11cbiAgICB9XG4gICAgdGhpcy5saXN0ZW5lcnNbd2hhdF0ucHVzaChjYilcbiAgfSxcblxuICAvKipcbiAgICogVW5kbyB0aGUgbW9zdCByZWNlbnQgY2hhbmdlLCBpZiBwb3NzaWJsZS5cbiAgICpcbiAgICogSWYgaGlzdG9yeSBpcyBlbXB0eSwgbm90aGluZyBoYXBwZW5zLlxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sfSB3aGV0aGVyIGFueXRoaW5nIGFjdHVhbGx5IGhhcHBlbmVkXG4gICAqL1xuICB1bmRvOiBmdW5jdGlvbiAoKSB7XG4gICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKClcbiAgICB2YXIgcG9zID0gdGhpcy5oaXN0cG9zID8gdGhpcy5oaXN0cG9zICsgMSA6IDFcbiAgICAgICwgaXggPSB0aGlzLmhpc3RvcnkubGVuZ3RoIC0gcG9zXG4gICAgaWYgKGl4IDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlIC8vIG5vIG1vcmUgdW5kbyFcbiAgICB9XG4gICAgdmFyIGNtZHMgPSB0aGlzLmhpc3RvcnlbaXhdXG4gICAgZm9yICh2YXIgaT1jbWRzLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcbiAgICAgIHRoaXMudW5kb0NvbW1hbmQoY21kc1tpXSlcbiAgICB9XG4gICAgdGhpcy5oaXN0cG9zICs9IDFcbiAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZScpXG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICAvKipcbiAgICogUmVkbyB0aGUgbW9zdCByZWNlbnQgdW5kbywgaWYgYW55XG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2x9IHdoZXRoZXIgYW5vdGhpbmcgd2FzIHJlZG9uZVxuICAgKi9cbiAgcmVkbzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwb3MgPSB0aGlzLmhpc3Rwb3MgPyB0aGlzLmhpc3Rwb3MgLSAxIDogLTFcbiAgICAgICwgaXggPSB0aGlzLmhpc3RvcnkubGVuZ3RoIC0gMSAtIHBvc1xuICAgIGlmIChpeCA+PSB0aGlzLmhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2UgLy8gbm8gbW9yZSB0byByZWRvIVxuICAgIH1cbiAgICB2YXIgY21kcyA9IHRoaXMuaGlzdG9yeVtpeF1cbiAgICBmb3IgKHZhciBpPTA7IGk8Y21kcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5yZWRvQ29tbWFuZChjbWRzW2ldKVxuICAgIH1cbiAgICB0aGlzLmhpc3Rwb3MgLT0gMVxuICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJylcbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuXG4gIC8vIHByaXZhdGlzaCB0aGluZ3NcbiAgc2V0VmlldzogZnVuY3Rpb24gKHZpZXcpIHtcbiAgICB0aGlzLnZpZXcgPSB2aWV3XG4gIH0sXG5cbiAgZG9Db21tYW5kOiBmdW5jdGlvbiAoY21kKSB7XG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZVxuICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbW1hbmRzW2NtZC50eXBlXS5hcHBseS5jYWxsKGNtZC5kYXRhLCB0aGlzLnZpZXcsIHRoaXMubW9kZWwpXG4gICAgdGhpcy53b3JraW5nID0gZmFsc2VcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgdW5kb0NvbW1hbmQ6IGZ1bmN0aW9uIChjbWQpIHtcbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlXG4gICAgdGhpcy5jb21tYW5kc1tjbWQudHlwZV0udW5kby5jYWxsKGNtZC5kYXRhLCB0aGlzLnZpZXcsIHRoaXMubW9kZWwpXG4gICAgdGhpcy53b3JraW5nID0gZmFsc2VcbiAgfSxcblxuICByZWRvQ29tbWFuZDogZnVuY3Rpb24gKGNtZCkge1xuICAgIHRoaXMud29ya2luZyA9IHRydWVcbiAgICB2YXIgYyA9IHRoaXMuY29tbWFuZHNbY21kLnR5cGVdXG4gICAgOyhjLnJlZG8gfHwgYy5hcHBseSkuY2FsbChjbWQuZGF0YSwgdGhpcy52aWV3LCB0aGlzLm1vZGVsKVxuICAgIHRoaXMud29ya2luZyA9IGZhbHNlXG4gIH0sXG59XG5cbiIsIlxuZnVuY3Rpb24gY29weShvbmUpIHtcbiAgaWYgKCdvYmplY3QnICE9PSB0eXBlb2Ygb25lKSByZXR1cm4gb25lXG4gIHZhciB0d28gPSB7fVxuICBmb3IgKHZhciBhdHRyIGluIG9uZSkge1xuICAgIHR3b1thdHRyXSA9IG9uZVthdHRyXVxuICB9XG4gIHJldHVybiB0d29cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbGxhcHNlOiB7XG4gICAgYXJnczogWydpZCcsICdkb0NvbGxhcHNlJ10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgbW9kZWwuc2V0Q29sbGFwc2VkKHRoaXMuaWQsIHRoaXMuZG9Db2xsYXBzZSlcbiAgICAgIHZpZXcuc2V0Q29sbGFwc2VkKHRoaXMuaWQsIHRoaXMuZG9Db2xsYXBzZSlcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICBtb2RlbC5zZXRDb2xsYXBzZWQodGhpcy5pZCwgIXRoaXMuZG9Db2xsYXBzZSlcbiAgICAgIHZpZXcuc2V0Q29sbGFwc2VkKHRoaXMuaWQsICF0aGlzLmRvQ29sbGFwc2UpXG4gICAgICB2aWV3LmdvVG8odGhpcy5pZClcbiAgICB9LFxuICB9LFxuXG4gIGFwcGVuZFRleHQ6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ3RleHQnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9sZHRleHQgPSBtb2RlbC5pZHNbdGhpcy5pZF0uY29udGVudFxuICAgICAgbW9kZWwuYXBwZW5kVGV4dCh0aGlzLmlkLCB0aGlzLnRleHQpXG4gICAgICB2aWV3LmFwcGVuZFRleHQodGhpcy5pZCwgdGhpcy50ZXh0KVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICBtb2RlbC5zZXRDb250ZW50KHRoaXMuaWQsIHRoaXMub2xkdGV4dClcbiAgICAgIHZpZXcuc2V0Q29udGVudCh0aGlzLmlkLCB0aGlzLm9sZHRleHQpXG4gICAgfVxuICB9LFxuXG4gIGNoYW5nZUNvbnRlbnQ6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ2NvbnRlbnQnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9sZGNvbnRlbnQgPSBtb2RlbC5pZHNbdGhpcy5pZF0uY29udGVudFxuICAgICAgbW9kZWwuc2V0Q29udGVudCh0aGlzLmlkLCB0aGlzLmNvbnRlbnQpXG4gICAgICB2aWV3LnNldENvbnRlbnQodGhpcy5pZCwgdGhpcy5jb250ZW50KVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldENvbnRlbnQodGhpcy5pZCwgdGhpcy5vbGRjb250ZW50KVxuICAgICAgdmlldy5zZXRDb250ZW50KHRoaXMuaWQsIHRoaXMub2xkY29udGVudClcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH1cbiAgfSxcblxuICBjaGFuZ2VOb2RlQXR0cjoge1xuICAgIGFyZ3M6IFsnaWQnLCAnYXR0cicsICd2YWx1ZSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHRoaXMub2xkdmFsdWUgPSBjb3B5KG1vZGVsLmlkc1t0aGlzLmlkXS5tZXRhW3RoaXMuYXR0cl0pXG4gICAgICBtb2RlbC5zZXRBdHRyKHRoaXMuaWQsIHRoaXMuYXR0ciwgdGhpcy52YWx1ZSlcbiAgICAgIHZpZXcuc2V0QXR0cih0aGlzLmlkLCB0aGlzLmF0dHIsIHRoaXMudmFsdWUpXG4gICAgICB2aWV3LmdvVG8odGhpcy5pZClcbiAgICB9LFxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgbW9kZWwuc2V0QXR0cih0aGlzLmlkLCB0aGlzLmF0dHIsIHRoaXMub2xkdmFsdWUpXG4gICAgICB2aWV3LnNldEF0dHIodGhpcy5pZCwgdGhpcy5hdHRyLCB0aGlzLm9sZHZhbHVlKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfVxuICB9LFxuXG4gIGNoYW5nZU5vZGU6IHtcbiAgICBhcmdzOiBbJ2lkJywgJ25ld21ldGEnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB0aGlzLm9sZG1ldGEgPSBjb3B5KG1vZGVsLmlkc1t0aGlzLmlkXS5tZXRhKVxuICAgICAgbW9kZWwuc2V0TWV0YSh0aGlzLmlkLCB0aGlzLm5ld21ldGEpXG4gICAgICB2aWV3LnNldE1ldGEodGhpcy5pZCwgdGhpcy5uZXdtZXRhKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfSxcblxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgbW9kZWwuc2V0TWV0YSh0aGlzLmlkLCB0aGlzLm9sZG1ldGEpXG4gICAgICB2aWV3LnNldE1ldGEodGhpcy5pZCwgdGhpcy5vbGRtZXRhKVxuICAgICAgdmlldy5nb1RvKHRoaXMuaWQpXG4gICAgfVxuICB9LFxuXG4gIG5ld05vZGU6IHtcbiAgICBhcmdzOiBbJ3BpZCcsICdpbmRleCcsICd0ZXh0JywgJ21ldGEnLCAndHlwZSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBjciA9IG1vZGVsLmNyZWF0ZSh0aGlzLnBpZCwgdGhpcy5pbmRleCwgdGhpcy50ZXh0LCB0aGlzLnR5cGUsIHRoaXMubWV0YSlcbiAgICAgIHRoaXMuaWQgPSBjci5ub2RlLmlkXG4gICAgICB2aWV3LmFkZChjci5ub2RlLCBjci5iZWZvcmUpXG4gICAgICAvLyB2aWV3LnN0YXJ0RWRpdGluZyhjci5ub2RlLmlkKVxuICAgIH0sXG5cbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBlZCA9IHZpZXcuZWRpdGluZ1xuICAgICAgdmlldy5yZW1vdmUodGhpcy5pZClcbiAgICAgIHRoaXMuc2F2ZWQgPSBtb2RlbC5yZW1vdmUodGhpcy5pZClcbiAgICAgIHZhciBuaWQgPSBtb2RlbC5pZHNbdGhpcy5waWRdLmNoaWxkcmVuW3RoaXMuaW5kZXgtMV1cbiAgICAgIGlmIChuaWQgPT09IHVuZGVmaW5lZCkgbmlkID0gdGhpcy5waWRcbiAgICAgIGlmIChlZCkge1xuICAgICAgICB2aWV3LnN0YXJ0RWRpdGluZyhuaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldEFjdGl2ZShuaWQpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGJlZm9yZSA9IG1vZGVsLnJlYWRkKHRoaXMuc2F2ZWQpXG4gICAgICB2aWV3LmFkZCh0aGlzLnNhdmVkLm5vZGUsIGJlZm9yZSlcbiAgICB9XG4gIH0sXG5cbiAgbW92ZToge1xuICAgIGFyZ3M6IFsnaWQnLCAncGlkJywgJ2luZGV4J10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdGhpcy5vcGlkID0gbW9kZWwuaWRzW3RoaXMuaWRdLnBhcmVudFxuICAgICAgdGhpcy5vaW5kZXggPSBtb2RlbC5pZHNbdGhpcy5vcGlkXS5jaGlsZHJlbi5pbmRleE9mKHRoaXMuaWQpXG4gICAgICB2YXIgYmVmb3JlID0gbW9kZWwubW92ZSh0aGlzLmlkLCB0aGlzLnBpZCwgdGhpcy5pbmRleClcbiAgICAgIHZhciBwYXJlbnQgPSBtb2RlbC5pZHNbdGhpcy5vcGlkXVxuICAgICAgICAsIGxhc3RjaGlsZCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGggPT09IDBcbiAgICAgIHZpZXcubW92ZSh0aGlzLmlkLCB0aGlzLnBpZCwgYmVmb3JlLCB0aGlzLm9waWQsIGxhc3RjaGlsZClcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH0sXG5cbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBiZWZvcmUgPSBtb2RlbC5tb3ZlKHRoaXMuaWQsIHRoaXMub3BpZCwgdGhpcy5vaW5kZXgpXG4gICAgICAgICwgbGFzdGNoaWxkID0gbW9kZWwuaWRzW3RoaXMucGlkXS5jaGlsZHJlbi5sZW5ndGggPT09IDBcbiAgICAgIHZpZXcubW92ZSh0aGlzLmlkLCB0aGlzLm9waWQsIGJlZm9yZSwgdGhpcy5waWQsIGxhc3RjaGlsZClcbiAgICAgIHZpZXcuZ29Ubyh0aGlzLmlkKVxuICAgIH1cbiAgfSxcblxuICByZW1vdmU6IHtcbiAgICBhcmdzOiBbJ2lkJ10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQodGhpcy5pZClcbiAgICAgIHZpZXcucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB0aGlzLnNhdmVkID0gbW9kZWwucmVtb3ZlKHRoaXMuaWQpXG4gICAgICB2aWV3LnN0YXJ0RWRpdGluZyhjbG9zZXN0KVxuICAgIH0sXG5cbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBiZWZvcmUgPSBtb2RlbC5yZWFkZCh0aGlzLnNhdmVkKVxuICAgICAgdmlldy5hZGRUcmVlKHRoaXMuc2F2ZWQubm9kZSwgYmVmb3JlKVxuICAgIH1cbiAgfSxcblxuICBjb3B5OiB7XG4gICAgYXJnczogWydpZHMnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgaXRlbXMgPSB0aGlzLmlkcy5tYXAoZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiBtb2RlbC5kdW1wRGF0YShpZCwgdHJ1ZSlcbiAgICAgIH0pXG4gICAgICBtb2RlbC5jbGlwYm9hcmQgPSBpdGVtc1xuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgfVxuICB9LFxuXG4gIGN1dDoge1xuICAgIGFyZ3M6IFsnaWRzJ10sXG4gICAgLy8gaWRzIGFyZSBhbHdheXMgaW4gZGVzY2VuZGluZyBvcmRlciwgd2hlcmUgMCBpcyB0aGUgZmlyc3Qgc2libGluZywgYW5kXG4gICAgLy8gdGhlIGxhc3QgaXRlbSBpcyB0aGUgbGFzdCBzaWJsaW5nXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pZHMubWFwKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2aWV3LnJlbW92ZShpZCwgdHJ1ZSlcbiAgICAgICAgcmV0dXJuIG1vZGVsLmR1bXBEYXRhKGlkLCB0cnVlKVxuICAgICAgfSlcbiAgICAgIG1vZGVsLmNsaXBib2FyZCA9IGl0ZW1zXG5cbiAgICAgIHZhciBpZCA9IHRoaXMuaWRzW3RoaXMuaWRzLmxlbmd0aC0xXVxuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQoaWQsIHRoaXMuaWRzKVxuICAgICAgdGhpcy5zYXZlZCA9IHRoaXMuaWRzLm1hcChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsLnJlbW92ZShpZClcbiAgICAgIH0pXG5cbiAgICAgIGlmICh2aWV3LmVkaXRpbmcpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcoY2xvc2VzdClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKGNsb3Nlc3QpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGJlZm9yZVxuICAgICAgZm9yICh2YXIgaT10aGlzLnNhdmVkLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcbiAgICAgICAgYmVmb3JlID0gbW9kZWwucmVhZGQodGhpcy5zYXZlZFtpXSlcbiAgICAgICAgdmlldy5hZGRUcmVlKHRoaXMuc2F2ZWRbaV0ubm9kZSwgYmVmb3JlKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdmlldy5zZXRTZWxlY3Rpb24odGhpcy5pZHMpXG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMuaWRzW3RoaXMuaWRzLmxlbmd0aC0xXSlcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaW1wb3J0RGF0YToge1xuICAgIGFyZ3M6IFsncGlkJywgJ2luZGV4JywgJ2RhdGEnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgcGlkID0gdGhpcy5waWRcbiAgICAgICAgLCBpbmRleCA9IHRoaXMuaW5kZXhcbiAgICAgICAgLCBlZCA9IHZpZXcuZWRpdGluZ1xuICAgICAgICAsIGl0ZW0gPSB0aGlzLmRhdGFcbiAgICAgIHZhciBjciA9IG1vZGVsLmNyZWF0ZU5vZGVzKHBpZCwgaW5kZXgsIGl0ZW0pXG4gICAgICB2aWV3LmFkZFRyZWUoY3Iubm9kZSwgY3IuYmVmb3JlKVxuICAgICAgdmlldy5zZXRDb2xsYXBzZWQoY3Iubm9kZS5wYXJlbnQsIGZhbHNlKVxuICAgICAgbW9kZWwuc2V0Q29sbGFwc2VkKGNyLm5vZGUucGFyZW50LCBmYWxzZSlcbiAgICAgIHRoaXMubmV3aWQgPSBjci5ub2RlLmlkXG4gICAgICBpZiAoZWQpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcodGhpcy5uZXdpZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMubmV3aWQpXG4gICAgICB9XG4gICAgfSxcblxuICAgIHVuZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdmFyIGlkID0gdGhpcy5uZXdpZFxuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQoaWQpXG4gICAgICB2aWV3LnJlbW92ZShpZClcbiAgICAgIHRoaXMuc2F2ZWQgPSBtb2RlbC5yZW1vdmUoaWQpXG4gICAgICBpZiAodmlldy5lZGl0aW5nKSB7XG4gICAgICAgIHZpZXcuc3RhcnRFZGl0aW5nKGNsb3Nlc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldEFjdGl2ZShjbG9zZXN0KVxuICAgICAgfVxuICAgICAgLy8gdmlldy5yZW1vdmUodGhpcy5uZXdpZClcbiAgICAgIC8vIHRoaXMuc2F2ZWQgPSBtb2RlbC5yZW1vdmUodGhpcy5uZXdpZClcbiAgICAgIG1vZGVsLmNsaXBib2FyZCA9IHRoaXMuc2F2ZWRcbiAgICB9LFxuICAgIHJlZG86IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgLy8gdmFyIGJlZm9yZSA9IG1vZGVsLnJlYWRkKHRoaXMuc2F2ZWQpXG4gICAgICAvLyB2aWV3LmFkZFRyZWUodGhpcy5zYXZlZC5ub2RlLCBiZWZvcmUpXG4gICAgICB2YXIgYmVmb3JlID0gbW9kZWwucmVhZGQodGhpcy5zYXZlZClcbiAgICAgIHZpZXcuYWRkVHJlZSh0aGlzLnNhdmVkLm5vZGUsIGJlZm9yZSlcbiAgICAgIGlmICh2aWV3LmVkaXRpbmcpIHtcbiAgICAgICAgdmlldy5zdGFydEVkaXRpbmcodGhpcy5uZXdpZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMubmV3aWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHBhc3RlOiB7XG4gICAgYXJnczogWydwaWQnLCAnaW5kZXgnXSxcbiAgICBhcHBseTogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICB2YXIgcGlkID0gdGhpcy5waWRcbiAgICAgICAgLCBpbmRleCA9IHRoaXMuaW5kZXhcbiAgICAgICAgLCBlZCA9IHZpZXcuZWRpdGluZ1xuICAgICAgdmFyIGlkcyA9IG1vZGVsLmNsaXBib2FyZC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGNyID0gbW9kZWwuY3JlYXRlTm9kZXMocGlkLCBpbmRleCwgaXRlbSlcbiAgICAgICAgdmlldy5hZGRUcmVlKGNyLm5vZGUsIGNyLmJlZm9yZSlcbiAgICAgICAgaWYgKG1vZGVsLmlkc1tjci5ub2RlLnBhcmVudF0uY29sbGFwc2VkKSB7XG4gICAgICAgICAgdmlldy5zZXRDb2xsYXBzZWQoY3Iubm9kZS5wYXJlbnQsIGZhbHNlKVxuICAgICAgICAgIG1vZGVsLnNldENvbGxhcHNlZChjci5ub2RlLnBhcmVudCwgZmFsc2UpXG4gICAgICAgIH1cbiAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICByZXR1cm4gY3Iubm9kZS5pZFxuICAgICAgfSlcbiAgICAgIHRoaXMubmV3aWRzID0gaWRzXG4gICAgICBpZiAoaWRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgIGlmIChlZCkge1xuICAgICAgICAgIHZpZXcuc3RhcnRFZGl0aW5nKHRoaXMubmV3aWRzWzBdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZpZXcuc2V0QWN0aXZlKHRoaXMubmV3aWRzWzBdKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldFNlbGVjdGlvbihpZHMpXG4gICAgICAgIHZpZXcuc2V0QWN0aXZlKGlkc1tpZHMubGVuZ3RoLTFdKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIHZhciBpZCA9IHRoaXMubmV3aWRzW3RoaXMubmV3aWRzLmxlbmd0aC0xXVxuICAgICAgdmFyIGNsb3Nlc3QgPSBtb2RlbC5jbG9zZXN0Tm9uQ2hpbGQoaWQpXG4gICAgICB0aGlzLnNhdmVkID0gdGhpcy5uZXdpZHMubWFwKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICB2aWV3LnJlbW92ZShpZClcbiAgICAgICAgcmV0dXJuIG1vZGVsLnJlbW92ZShpZClcbiAgICAgIH0pXG4gICAgICBpZiAodmlldy5lZGl0aW5nKSB7XG4gICAgICAgIHZpZXcuc3RhcnRFZGl0aW5nKGNsb3Nlc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3LnNldEFjdGl2ZShjbG9zZXN0KVxuICAgICAgfVxuICAgIH0sXG5cbiAgICByZWRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIC8vIHZhciBiZWZvcmUgPSBtb2RlbC5yZWFkZCh0aGlzLnNhdmVkKVxuICAgICAgLy8gdmlldy5hZGRUcmVlKHRoaXMuc2F2ZWQubm9kZSwgYmVmb3JlKVxuICAgICAgdGhpcy5zYXZlZC5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGJlZm9yZSA9IG1vZGVsLnJlYWRkKGl0ZW0pXG4gICAgICAgIHZpZXcuYWRkVHJlZShpdGVtLm5vZGUsIGJlZm9yZSlcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyXG5cbnZhciBDb21tYW5kZWdlciA9IHJlcXVpcmUoJy4vY29tbWFuZGVnZXInKVxuXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbmZ1bmN0aW9uIENvbnRyb2xsZXIobW9kZWwsIG8pIHtcbiAgdGhpcy5vID0gdXRpbC5leHRlbmQoe1xuICAgIG5vQ29sbGFwc2VSb290OiB0cnVlLFxuICAgIGV4dHJhX2NvbW1hbmRzOiBmYWxzZVxuICB9LCBvIHx8IHt9KVxuICB0aGlzLm1vZGVsID0gbW9kZWxcbiAgdGhpcy5jbWQgPSBuZXcgQ29tbWFuZGVnZXIodGhpcy5tb2RlbCwgdGhpcy5vLmV4dHJhX2NvbW1hbmRzKVxuXG4gIHRoaXMubW9kZWwuZGIubGlzdGVuKCdub2RlJywgdGhpcy5hZGRGcm9tRGIuYmluZCh0aGlzKSwgdGhpcy51cGRhdGVGcm9tRGIuYmluZCh0aGlzKSlcblxuICB2YXIgYWN0aW9ucyA9IHt9XG4gIGZvciAodmFyIGFjdGlvbiBpbiB0aGlzLmFjdGlvbnMpIHtcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiB0aGlzLmFjdGlvbnNbYWN0aW9uXSkgYWN0aW9uc1thY3Rpb25dID0gdGhpcy5hY3Rpb25zW2FjdGlvbl1cbiAgICBlbHNlIGFjdGlvbnNbYWN0aW9uXSA9IHRoaXMuYWN0aW9uc1thY3Rpb25dLmJpbmQodGhpcylcbiAgfVxuICB0aGlzLmFjdGlvbnMgPSBhY3Rpb25zXG4gIHRoaXMubGlzdGVuZXJzID0ge31cbn1cblxuQ29udHJvbGxlci5wcm90b3R5cGUgPSB7XG4gIGFkZEZyb21EYjogZnVuY3Rpb24gKGlkLCBkYXRhKSB7XG4gICAgLy8gaWYgKHRoaXMubW9kZWwuaWRzW2lkXSkgcmV0dXJuXG4gICAgdGhpcy52aWV3LnVwZGF0ZShpZCwgZGF0YSlcbiAgICB0aGlzLm1vZGVsLmlkc1tpZF0gPSBkYXRhXG4gIH0sXG4gIHVwZGF0ZUZyb21EYjogZnVuY3Rpb24gKGlkLCBkYXRhKSB7XG4gICAgdGhpcy52aWV3LnVwZGF0ZShpZCwgZGF0YSlcbiAgICB0aGlzLm1vZGVsLmlkc1tpZF0gPSBkYXRhXG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY3VycmVudCB2aWV3XG4gICAqXG4gICAqIEBwYXJhbSB7Y2xhc3N9IFZpZXcgdGhlIFZpZXcgY2xhc3NcbiAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgdGhlIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgdmlld1xuICAgKiBAcmV0dXJuIHtWaWV3fSB0aGUgdmlldyBvYmplY3RcbiAgICovXG4gIHNldFZpZXc6IGZ1bmN0aW9uIChWaWV3LCBvcHRpb25zKSB7XG4gICAgdmFyIG92aWV3ID0gdGhpcy52aWV3XG4gICAgdGhpcy52aWV3ID0gbmV3IFZpZXcoXG4gICAgICB0aGlzLmJpbmRBY3Rpb25zLmJpbmQodGhpcyksXG4gICAgICB0aGlzLm1vZGVsLCB0aGlzLmFjdGlvbnMsXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgdmFyIHJvb3QgPSAob3ZpZXcgPyBvdmlldy5yb290IDogdGhpcy5tb2RlbC5yb290KTtcbiAgICB2YXIgbm9kZSA9IHRoaXMudmlldy5pbml0aWFsaXplKHJvb3QpXG4gICAgaWYgKG92aWV3KSB7XG4gICAgICBvdmlldy5nZXROb2RlKCkucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobm9kZSwgb3ZpZXcuZ2V0Tm9kZSgpKTtcbiAgICB9XG4gICAgdGhpcy5jbWQuc2V0Vmlldyh0aGlzLnZpZXcpXG4gICAgcmV0dXJuIHRoaXMudmlld1xuICB9LFxuXG4gIC8qKlxuICAgKiBVbmRvIHRoZSBtb3N0IHJlY2VudCBjb21tZW50XG4gICAqL1xuICB1bmRvOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jbWQudW5kbygpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlZG8gdGhlIG1vc3QgcmVjZW50IHVuZG9cbiAgICovXG4gIHJlZG86IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNtZC5yZWRvKClcbiAgfSxcblxuICAvKipcbiAgICogQXR0YWNoIGEgbGlzdGVuZXJcbiAgICovXG4gIG9uOiBmdW5jdGlvbiAoZXZ0LCBmdW5jKSB7XG4gICAgaWYgKCF0aGlzLmxpc3RlbmVyc1tldnRdKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyc1tldnRdID0gW11cbiAgICB9XG4gICAgdGhpcy5saXN0ZW5lcnNbZXZ0XS5wdXNoKGZ1bmMpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGxpc3RlbmVyXG4gICAqL1xuICBvZmY6IGZ1bmN0aW9uIChldnQsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMubGlzdGVuZXJzW2V2dF0pIHJldHVybiBmYWxzZVxuICAgIHZhciBpID0gdGhpcy5saXN0ZW5lcnNbZXZ0XS5pbmRleE9mKGZ1bmMpXG4gICAgaWYgKGkgPT09IC0xKSByZXR1cm4gZmFsc2VcbiAgICB0aGlzLmxpc3RlbmVyc1tldnRdLnNwbGljZShpLCAxKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYW4gZXZlbnRcbiAgICovXG4gIHRyaWdnZXI6IGZ1bmN0aW9uIChldnQpIHtcbiAgICBpZiAoIXRoaXMubGlzdGVuZXJzW2V2dF0pIHJldHVyblxuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMubGlzdGVuZXJzW2V2dF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMubGlzdGVuZXJzW2V2dF1baV0uYXBwbHkobnVsbCwgYXJncylcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBib3VuZCB2ZXJzaW9ucyBvZiBlYWNoIGFjdGlvbiBmdW5jdGlvbiBmb3IgYSBnaXZlbiBpZFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgdGhpcyBpZCB0cyBzaW5zIHRoaW5nc1xuICAgKi9cbiAgYmluZEFjdGlvbnM6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBhY3Rpb25zID0ge31cbiAgICAgICwgdmFsXG4gICAgZm9yICh2YXIgYWN0aW9uIGluIHRoaXMuYWN0aW9ucykge1xuICAgICAgdmFsID0gdGhpcy5hY3Rpb25zW2FjdGlvbl1cbiAgICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHZhbCkge1xuICAgICAgICB2YWwgPSB0aGlzW3ZhbF1bYWN0aW9uXS5iaW5kKHRoaXNbdmFsXSwgaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWwgPSB2YWwuYmluZCh0aGlzLCBpZClcbiAgICAgIH1cbiAgICAgIGFjdGlvbnNbYWN0aW9uXSA9IHZhbFxuICAgIH1cbiAgICByZXR1cm4gYWN0aW9uc1xuICB9LFxuXG4gIGltcG9ydERhdGE6IGZ1bmN0aW9uIChkYXRhLCBwYXJlbnQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGFyZW50ID0gdGhpcy52aWV3LmdldEFjdGl2ZSgpO1xuICAgIH1cbiAgICBpZiAocGFyZW50ID09PSBcIm5ld1wiKSB7XG4gICAgICAgIHRoaXMudmlldy5yZW1vdmVOZXcoKVxuICAgICAgICBwYXJlbnQgPSB0aGlzLnZpZXcucm9vdFxuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnaW1wb3J0RGF0YScsIFtwYXJlbnQsIDAsIGRhdGFdKVxuICAgIC8vIHRoaXMubW9kZWwuY3JlYXRlTm9kZXModGhpcy52aWV3LmdldEFjdGl2ZSgpLCAwLCBkYXRhKVxuICAgIC8vIHRoaXMudmlldy5yZWJhc2UodGhpcy52aWV3LnJvb3QpXG4gIH0sXG5cbiAgZXhwb3J0RGF0YTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1vZGVsLmR1bXBEYXRhKHRoaXMubW9kZWwucm9vdCwgdHJ1ZSlcbiAgfSxcblxuICBleGVjdXRlQ29tbWFuZHM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVzXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmd1bWVudHNbMF0pKSB7XG4gICAgICByZXMgPSB0aGlzLmNtZC5leGVjdXRlQ29tbWFuZHMuYXBwbHkodGhpcy5jbWQsIGFyZ3VtZW50c1swXSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzID0gdGhpcy5jbWQuZXhlY3V0ZUNvbW1hbmRzLmFwcGx5KHRoaXMuY21kLCBhcmd1bWVudHMpXG4gICAgfVxuICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJylcbiAgICByZXR1cm4gcmVzXG4gIH0sXG5cbiAgLy8gcHVibGljXG4gIHNldENvbGxhcHNlZDogZnVuY3Rpb24gKGlkLCBkb0NvbGxhcHNlKSB7XG4gICAgaWYgKHRoaXMuby5ub0NvbGxhcHNlUm9vdCAmJiBpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgIGlmICghdGhpcy5tb2RlbC5oYXNDaGlsZHJlbihpZCkpIHJldHVyblxuICAgIGlmICh0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKSA9PT0gZG9Db2xsYXBzZSkgcmV0dXJuXG4gICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NvbGxhcHNlJywgW2lkLCBkb0NvbGxhcHNlXSk7XG4gIH0sXG5cbiAgYWRkQmVmb3JlOiBmdW5jdGlvbiAoaWQsIHRleHQpIHtcbiAgICB2YXIgbncgPSB0aGlzLm1vZGVsLmlkTmV3KGlkLCB0cnVlKVxuICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCduZXdOb2RlJywgW253LnBpZCwgbncuaW5kZXgsIHRleHRdKVxuICB9LFxuXG4gIGFjdGlvbnM6IHtcbiAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0sXG5cbiAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgdGhpcy52aWV3LnNldEFjdGl2ZShpZClcbiAgICB9LFxuXG4gICAgLy8gbW92ZSBmb2N1c1xuICAgIGdvVXA6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm4gdGhpcy52aWV3LmdvVG8odGhpcy52aWV3LnJvb3QpXG4gICAgICAvLyBzaG91bGQgSSBjaGVjayB0byBzZWUgaWYgaXQncyBvaz9cbiAgICAgIHZhciBhYm92ZSA9IHRoaXMubW9kZWwuaWRBYm92ZShpZClcbiAgICAgIGlmIChhYm92ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm5cbiAgICAgIHRoaXMudmlldy5zdGFydEVkaXRpbmcoYWJvdmUpO1xuICAgIH0sXG5cbiAgICBnb0Rvd246IGZ1bmN0aW9uIChpZCwgZnJvbVN0YXJ0KSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm4gdGhpcy52aWV3LmdvVG8odGhpcy52aWV3LnJvb3QpXG4gICAgICB2YXIgYmVsb3cgPSB0aGlzLm1vZGVsLmlkQmVsb3coaWQsIHRoaXMudmlldy5yb290KVxuICAgICAgaWYgKGJlbG93ID09PSB1bmRlZmluZWQpIHJldHVyblxuICAgICAgdGhpcy52aWV3LnN0YXJ0RWRpdGluZyhiZWxvdywgZnJvbVN0YXJ0KTtcbiAgICB9LFxuXG4gICAgZ29MZWZ0OiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVybiB0aGlzLnZpZXcuZ29Ubyh0aGlzLnZpZXcucm9vdClcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgdmFyIHBhcmVudCA9IHRoaXMubW9kZWwuZ2V0UGFyZW50KGlkKVxuICAgICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgICAgdGhpcy52aWV3LnN0YXJ0RWRpdGluZyhwYXJlbnQpXG4gICAgfSxcblxuICAgIGdvUmlnaHQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuIHRoaXMudmlldy5nb1RvKHRoaXMudmlldy5yb290KVxuICAgICAgdmFyIGNoaWxkID0gdGhpcy5tb2RlbC5nZXRDaGlsZChpZClcbiAgICAgIGlmICghY2hpbGQpIHJldHVyblxuICAgICAgdGhpcy52aWV3LnN0YXJ0RWRpdGluZyhjaGlsZClcbiAgICB9LFxuXG4gICAgc3RhcnRNb3Zpbmc6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIHRoaXMudmlldy5zdGFydE1vdmluZyhpZClcbiAgICB9LFxuXG4gICAgLy8gbW9kaWZpY2F0aW9uXG4gICAgdW5kbzogZnVuY3Rpb24gKCkge3RoaXMuY21kLnVuZG8oKX0sXG4gICAgcmVkbzogZnVuY3Rpb24gKCkge3RoaXMuY21kLnJlZG8oKX0sXG5cbiAgICAvLyBjb21tYW5kZXJzXG4gICAgY3V0OiBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICBpZiAoaWRzID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaWRzKSkge1xuICAgICAgICBpZHMgPSBbaWRzXVxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2N1dCcsIFtpZHNdKVxuICAgIH0sXG5cbiAgICBjb3B5OiBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaWRzKSkge1xuICAgICAgICBpZHMgPSBbaWRzXVxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NvcHknLCBbaWRzXSlcbiAgICB9LFxuXG4gICAgcGFzdGVBYm92ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5hY3Rpb25zLnBhc3RlKGlkLCB0cnVlKVxuICAgIH0sXG5cbiAgICBwYXN0ZTogZnVuY3Rpb24gKGlkLCBhYm92ZSkge1xuICAgICAgaWYgKCF0aGlzLm1vZGVsLmNsaXBib2FyZCkgcmV0dXJuXG4gICAgICB2YXIgbncgPSB0aGlzLm1vZGVsLmlkTmV3KGlkLCBhYm92ZSlcbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdwYXN0ZScsIFtudy5waWQsIG53LmluZGV4XSlcbiAgICB9LFxuXG4gICAgY2hhbmdlQ29udGVudDogZnVuY3Rpb24gKGlkLCBjb250ZW50KSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSB7XG4gICAgICAgIGlmICghY29udGVudCkgcmV0dXJuXG4gICAgICAgIHZhciBudyA9IHRoaXMudmlldy5yZW1vdmVOZXcoKVxuICAgICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4LCBjb250ZW50LCB7fV0pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NoYW5nZUNvbnRlbnQnLCBbaWQsIGNvbnRlbnRdKVxuICAgIH0sXG5cbiAgICBjaGFuZ2VkOiBmdW5jdGlvbiAoaWQsIGF0dHIsIHZhbHVlKSB7XG4gICAgICBpZiAoaWQgPT09ICduZXcnKSB7XG4gICAgICAgIGlmICghdmFsdWUpIHJldHVyblxuICAgICAgICB2YXIgbncgPSB0aGlzLnZpZXcucmVtb3ZlTmV3KClcbiAgICAgICAgdmFyIG1ldGEgPSB7fVxuICAgICAgICBtZXRhW2F0dHJdID0gdmFsdWVcbiAgICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ25ld05vZGUnLCBbbncucGlkLCBudy5pbmRleCwgJycsIG1ldGFdKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdjaGFuZ2VOb2RlQXR0cicsIFtpZCwgYXR0ciwgdmFsdWVdKVxuICAgIH0sXG5cbiAgICAvLyBtb3ZlIG5vZGVcbiAgICBtb3ZlOiBmdW5jdGlvbiAod2hlcmUsIGlkLCB0YXJnZXQpIHtcbiAgICAgIHZhciBhY3Rpb24gPSB7XG4gICAgICAgIGJlZm9yZTogJ1RvQmVmb3JlJyxcbiAgICAgICAgYWZ0ZXI6ICdUb0FmdGVyJyxcbiAgICAgICAgY2hpbGQ6ICdJbnRvJyxcbiAgICAgICAgbGFzdENoaWxkOiAnSW50b0xhc3QnXG4gICAgICB9W3doZXJlXVxuICAgICAgdGhpcy5hY3Rpb25zWydtb3ZlJyArIGFjdGlvbl0oaWQsIHRhcmdldCkvL3RhcmdldCwgaWQpXG4gICAgfSxcblxuICAgIG1vdmVUb0JlZm9yZTogZnVuY3Rpb24gKGlkLCBzaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB2YXIgcGxhY2UgPSB0aGlzLm1vZGVsLm1vdmVCZWZvcmVQbGFjZShzaWQsIGlkKVxuICAgICAgaWYgKCFwbGFjZSkgcmV0dXJuXG4gICAgICAvLyBpZiAodGhpcy5tb2RlbC5zYW1lUGxhY2UoaWQsIHBsYWNlKSkgcmV0dXJuXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbW92ZScsIFtpZCwgcGxhY2UucGlkLCBwbGFjZS5peF0pXG4gICAgfSxcblxuICAgIG1vdmVUb0FmdGVyOiBmdW5jdGlvbiAoaWQsIHNpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIHZhciBwbGFjZSA9IHRoaXMubW9kZWwubW92ZUFmdGVyUGxhY2Uoc2lkLCBpZClcbiAgICAgIGlmICghcGxhY2UpIHJldHVyblxuICAgICAgLy8gaWYgKHRoaXMubW9kZWwuc2FtZVBsYWNlKGlkLCBwbGFjZSkpIHJldHVyblxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBsYWNlLnBpZCwgcGxhY2UuaXhdKVxuICAgIH0sXG5cbiAgICBtb3ZlSW50bzogZnVuY3Rpb24gKGlkLCBwaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICBpZiAodGhpcy5tb2RlbC5zYW1lUGxhY2UoaWQsIHtwaWQ6IHBpZCwgaXg6IDB9KSkgcmV0dXJuXG4gICAgICBpZiAoIXRoaXMubW9kZWwuaXNDb2xsYXBzZWQocGlkKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBpZCwgMF0pXG4gICAgICB9XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnY29sbGFwc2UnLCBbcGlkLCBmYWxzZV0sICdtb3ZlJywgW2lkLCBwaWQsIDBdKVxuICAgIH0sXG5cbiAgICBtb3ZlSW50b0xhc3Q6IGZ1bmN0aW9uIChpZCwgcGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgdmFyIGl4ID0gdGhpcy5tb2RlbC5pZHNbcGlkXS5jaGlsZHJlbi5sZW5ndGhcbiAgICAgIGlmICh0aGlzLm1vZGVsLnNhbWVQbGFjZShpZCwge3BpZDogcGlkLCBpeDogaXh9KSkgcmV0dXJuXG4gICAgICBpZiAoIXRoaXMubW9kZWwuaXNDb2xsYXBzZWQocGlkKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBpZCwgaXhdKVxuICAgICAgfVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2NvbGxhcHNlJywgW3BpZCwgZmFsc2VdLCAnbW92ZScsIFtpZCwgcGlkLCBpeF0pXG4gICAgfSxcblxuICAgIG1vdmVSaWdodDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgdmFyIHNpYiA9IHRoaXMubW9kZWwucHJldlNpYmxpbmcoaWQsIHRydWUpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBzaWIpIHJldHVyblxuICAgICAgaWYgKCF0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKHNpYikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBzaWIsIGZhbHNlXSlcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdjb2xsYXBzZScsIFtzaWIsIGZhbHNlXSwgJ21vdmUnLCBbaWQsIHNpYiwgZmFsc2VdKVxuICAgIH0sXG5cbiAgICBtb3ZlTGVmdDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgaWYgKHRoaXMubW9kZWwuaWRzW2lkXS5wYXJlbnQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIC8vIFRPRE8gaGFuZGxlIG11bHRpcGxlIHNlbGVjdGVkXG4gICAgICB2YXIgcGxhY2UgPSB0aGlzLm1vZGVsLnNoaWZ0TGVmdFBsYWNlKGlkKVxuICAgICAgaWYgKCFwbGFjZSkgcmV0dXJuXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbW92ZScsIFtpZCwgcGxhY2UucGlkLCBwbGFjZS5peF0pXG4gICAgfSxcblxuICAgIG1vdmVVcDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgICAgLy8gVE9ETyBoYW5kbGUgbXVsdGlwbGUgc2VsZWN0ZWRcbiAgICAgIHZhciBwbGFjZSA9IHRoaXMubW9kZWwuc2hpZnRVcFBsYWNlKGlkKVxuICAgICAgaWYgKCFwbGFjZSkgcmV0dXJuXG4gICAgICBpZiAocGxhY2UucGlkID09PSB0aGlzLm1vZGVsLmlkc1t0aGlzLnZpZXcucm9vdF0ucGFyZW50KSByZXR1cm5cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwbGFjZS5waWQsIHBsYWNlLml4XSlcbiAgICB9LFxuXG4gICAgbW92ZURvd246IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIC8vIFRPRE8gaGFuZGxlIG11bHRpcGxlIHNlbGVjdGVkXG4gICAgICB2YXIgcGxhY2UgPSB0aGlzLm1vZGVsLnNoaWZ0RG93blBsYWNlKGlkKVxuICAgICAgaWYgKCFwbGFjZSkgcmV0dXJuXG4gICAgICBpZiAocGxhY2UucGlkID09PSB0aGlzLm1vZGVsLmlkc1t0aGlzLnZpZXcucm9vdF0ucGFyZW50KSByZXR1cm5cbiAgICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdtb3ZlJywgW2lkLCBwbGFjZS5waWQsIHBsYWNlLml4XSlcbiAgICB9LFxuXG4gICAgbW92ZVRvVG9wOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3JykgcmV0dXJuXG4gICAgICB2YXIgZmlyc3QgPSB0aGlzLm1vZGVsLmZpcnN0U2libGluZyhpZClcbiAgICAgIGlmICh1bmRlZmluZWQgPT09IGZpcnN0KSByZXR1cm5cbiAgICAgIHZhciBwaWQgPSB0aGlzLm1vZGVsLmlkc1tmaXJzdF0ucGFyZW50XG4gICAgICBpZiAocGlkID09PSB1bmRlZmluZWQpIHJldHVyblxuICAgICAgdmFyIGl4ID0gdGhpcy5tb2RlbC5pZHNbcGlkXS5jaGlsZHJlbi5pbmRleE9mKGZpcnN0KVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBpZCwgaXhdKVxuICAgIH0sXG5cbiAgICBtb3ZlVG9Cb3R0b206IGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIHZhciBsYXN0ID0gdGhpcy5tb2RlbC5sYXN0U2libGluZyhpZClcbiAgICAgIGlmICh1bmRlZmluZWQgPT09IGxhc3QpIHJldHVyblxuICAgICAgdmFyIHBpZCA9IHRoaXMubW9kZWwuaWRzW2xhc3RdLnBhcmVudFxuICAgICAgaWYgKHBpZCA9PT0gdW5kZWZpbmVkKSByZXR1cm5cbiAgICAgIHZhciBpeCA9IHRoaXMubW9kZWwuaWRzW3BpZF0uY2hpbGRyZW4uaW5kZXhPZihsYXN0KVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ21vdmUnLCBbaWQsIHBpZCwgaXggKyAxXSlcbiAgICB9LFxuXG4gICAgdG9nZ2xlQ29sbGFwc2U6IGZ1bmN0aW9uIChpZCwgeWVzKSB7XG4gICAgICBpZiAodGhpcy5vLm5vQ29sbGFwc2VSb290ICYmIGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHllcyA9ICF0aGlzLm1vZGVsLmhhc0NoaWxkcmVuKGlkKSB8fCAhdGhpcy5tb2RlbC5pc0NvbGxhcHNlZChpZClcbiAgICAgIH1cbiAgICAgIGlmICh5ZXMpIHtcbiAgICAgICAgaWQgPSB0aGlzLm1vZGVsLmZpbmRDb2xsYXBzZXIoaWQpXG4gICAgICAgIGlmICh0aGlzLm8ubm9Db2xsYXBzZVJvb3QgJiYgaWQgPT09IHRoaXMudmlldy5yb290KSByZXR1cm5cbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsLmhhc0NoaWxkcmVuKGlkKSB8fCB0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKSkgcmV0dXJuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMubW9kZWwuaGFzQ2hpbGRyZW4oaWQpIHx8ICF0aGlzLm1vZGVsLmlzQ29sbGFwc2VkKGlkKSkgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnY29sbGFwc2UnLCBbaWQsIHllc10pXG4gICAgfSxcblxuICAgIGFkZENoaWxkOiBmdW5jdGlvbiAocGlkLCBpbmRleCwgY29udGVudCwgY29uZmlnKSB7XG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtwaWQsIGluZGV4LCBjb250ZW50LCBjb25maWddKVxuICAgIH0sXG5cbiAgICBjb21tYW5kczogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0sXG5cbiAgICBhZGRCZWZvcmU6IGZ1bmN0aW9uIChpZCwgdGV4dCwgZm9jdXMpIHtcbiAgICAgIGlmIChpZCA9PT0gdGhpcy52aWV3LnJvb3QpIHJldHVyblxuICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xuICAgICAgICAvLyBUT0RPOiBiZXR0ZXIgYmVoYXZpb3IgaGVyZVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHZhciBudyA9IHRoaXMubW9kZWwuaWROZXcoaWQsIHRydWUpXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcygnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4LCB0ZXh0XSlcbiAgICAgIGlmIChmb2N1cykgdGhpcy52aWV3LnN0YXJ0RWRpdGluZygpXG4gICAgfSxcblxuICAgIGFkZEFmdGVyOiBmdW5jdGlvbiAoaWQsIHRleHQsIGZvY3VzKSB7XG4gICAgICB2YXIgbndcbiAgICAgIHZhciBlZCA9IGZvY3VzIHx8IHRoaXMudmlldy5tb2RlID09PSAnaW5zZXJ0J1xuICAgICAgLy8gdGhpcy52aWV3LnN0b3BFZGl0aW5nKClcbiAgICAgIGlmIChpZCA9PT0gJ25ldycpIHtcbiAgICAgICAgLy8gVE9ETzogYmV0dGVyIGJlaGF2aW9yIGhlcmVcblxuICAgICAgICBudyA9IHRoaXMudmlldy5yZW1vdmVOZXcoKVxuICAgICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcyhcbiAgICAgICAgICAnbmV3Tm9kZScsIFtudy5waWQsIG53LmluZGV4KzEsICcnXVxuICAgICAgICApXG4gICAgICAgIGlmIChlZCkgdGhpcy52aWV3LnN0YXJ0RWRpdGluZygpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuaWRzW2lkXVxuICAgICAgICBpZiAoIW5vZGUuY2hpbGRyZW4gfHwgIW5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMudmlldy5uZXdOb2RlKSByZXR1cm4gdGhpcy52aWV3LnN0YXJ0RWRpdGluZygnbmV3JylcbiAgICAgICAgICB0aGlzLnZpZXcuYWRkTmV3KGlkLCAwKVxuICAgICAgICAgIHRoaXMudmlldy5zdGFydEVkaXRpbmcoJ25ldycpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG53ID0gdGhpcy5tb2RlbC5pZE5ldyhpZCwgZmFsc2UsIHRoaXMudmlldy5yb290KVxuICAgICAgdGhpcy5leGVjdXRlQ29tbWFuZHMoJ25ld05vZGUnLCBbbncucGlkLCBudy5pbmRleCwgdGV4dF0pXG4gICAgICBpZiAoZWQpIHRoaXMudmlldy5zdGFydEVkaXRpbmcoKVxuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChpZCwgYWRkVGV4dCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnZpZXcucm9vdCkgcmV0dXJuXG4gICAgICBpZiAoaWQgPT09ICduZXcnKSByZXR1cm5cbiAgICAgIHZhciBiZWZvcmUgPSB0aGlzLm1vZGVsLmlkQWJvdmUoaWQpXG4gICAgICB0aGlzLmV4ZWN1dGVDb21tYW5kcyhcbiAgICAgICAgJ3JlbW92ZScsIFtpZF0sXG4gICAgICAgICdhcHBlbmRUZXh0JywgW2JlZm9yZSwgYWRkVGV4dCB8fCAnJ11cbiAgICAgIClcbiAgICB9LFxuXG4gICAgc2V0RWRpdGluZzogJ3ZpZXcnLFxuICAgIGRvbmVFZGl0aW5nOiAndmlldydcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICB2aXN1YWw6IHtcbiAgICAnc2VsZWN0IHVwJzogJ2ssIHVwJyxcbiAgICAnc2VsZWN0IGRvd24nOiAnaiwgZG93bicsXG4gICAgJ3NlbGVjdCB0byBib3R0b20nOiAnc2hpZnQrZycsXG4gICAgJ3NlbGVjdCB0byB0b3AnOiAnZyBnJyxcbiAgICAnc3RvcCBzZWxlY3RpbmcnOiAndiwgc2hpZnQrdiwgZXNjYXBlJyxcbiAgICAnZWRpdCc6ICdhLCBzaGlmdCthJyxcbiAgICAnZWRpdCBzdGFydCc6ICdpLCBzaGlmdCtpJyxcbiAgICAnY3V0JzogJ2QsIHNoaWZ0K2QsIGN0cmwreCcsXG4gICAgJ2NvcHknOiAneSwgc2hpZnQreSwgY3RybCtjJyxcbiAgICAndW5kbyc6ICd1LCBjdHJsK3onLFxuICAgICdyZWRvJzogJ3NoaWZ0K3IsIGN0cmwrc2hpZnQreidcbiAgfSxcbiAgdmlldzoge1xuICAgIGJhc2U6IHtcbiAgICAgICdjdXQnOiAnY21kK3gsIGRlbGV0ZSwgZCBkJyxcbiAgICAgICdjb3B5JzogJ2NtZCtjLCB5IHknLFxuICAgICAgJ3Bhc3RlJzogJ3AsIGNtZCt2JyxcbiAgICAgICdwYXN0ZSBhYm92ZSc6ICdzaGlmdCtwLCBjbWQrc2hpZnQrdicsXG4gICAgICAndmlzdWFsIG1vZGUnOiAndiwgc2hpZnQrdicsXG5cbiAgICAgICdjaGFuZ2UnOiAnYyBjLCBzaGlmdCtjJyxcbiAgICAgICdlZGl0JzogJ3JldHVybiwgYSwgc2hpZnQrYSwgZjInLFxuICAgICAgJ2VkaXQgc3RhcnQnOiAnaSwgc2hpZnQraScsXG4gICAgICAnZmlyc3Qgc2libGluZyc6ICdzaGlmdCtbJyxcbiAgICAgICdsYXN0IHNpYmxpbmcnOiAnc2hpZnQrXScsXG4gICAgICAnbW92ZSB0byBmaXJzdCBzaWJsaW5nJzogJ2N0cmwrc2hpZnQrWycsXG4gICAgICAnbW92ZSB0byBsYXN0IHNpYmxpbmcnOiAnY3RybCtzaGlmdCtdJyxcbiAgICAgICduZXcgYWZ0ZXInOiAnbycsXG4gICAgICAnbmV3IGJlZm9yZSc6ICdzaGlmdCtvJyxcbiAgICAgICdqdW1wIHRvIHRvcCc6ICdnIGcnLFxuICAgICAgJ2p1bXAgdG8gYm90dG9tJzogJ3NoaWZ0K2cnLFxuICAgICAgJ3VwJzogJ3VwLCBrJyxcbiAgICAgICdkb3duJzogJ2Rvd24sIGonLFxuICAgICAgJ2xlZnQnOiAnbGVmdCwgaCcsXG4gICAgICAncmlnaHQnOiAncmlnaHQsIGwnLFxuICAgICAgJ25leHQgc2libGluZyc6ICdhbHQraiwgYWx0K2Rvd24nLFxuICAgICAgJ3ByZXYgc2libGluZyc6ICdhbHQraywgYWx0K3VwJyxcbiAgICAgICd0b2dnbGUgY29sbGFwc2UnOiAneicsXG4gICAgICAnY29sbGFwc2UnOiAnYWx0K2gsIGFsdCtsZWZ0JyxcbiAgICAgICd1bmNvbGxhcHNlJzogJ2FsdCtsLCBhbHQrcmlnaHQnLFxuICAgICAgJ2luZGVudCc6ICd0YWIsIHNoaWZ0K2FsdCtsLCBzaGlmdCthbHQrcmlnaHQnLFxuICAgICAgJ2RlZGVudCc6ICdzaGlmdCt0YWIsIHNoaWZ0K2FsdCtoLCBzaGlmdCthbHQrbGVmdCcsXG4gICAgICAnbW92ZSBkb3duJzogJ3NoaWZ0K2FsdCtqLCBzaGlmdCthbHQrZG93bicsXG4gICAgICAnbW92ZSB1cCc6ICdzaGlmdCthbHQraywgc2hpZnQrYWx0K2ksIHNoaWZ0K2FsdCt1cCcsXG4gICAgICAndW5kbyc6ICdjdHJsK3osIHUnLFxuICAgICAgJ3JlZG8nOiAnY3RybCtzaGlmdCt6LCBzaGlmdCtyJyxcbiAgICB9LFxuXG4gICAgbWFjOiB7XG4gICAgfSxcbiAgICBwYzoge1xuICAgIH1cbiAgfSxcbn1cblxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdE5vZGVcblxudmFyIEJhc2VOb2RlID0gcmVxdWlyZSgnLi9iYXNlLW5vZGUnKVxuXG5pZiAod2luZG93Lm1hcmtlZCkge1xuICB2YXIgcmVuZGVyZXIgPSBuZXcgbWFya2VkLlJlbmRlcmVyKClcbiAgcmVuZGVyZXIubGluayA9IGZ1bmN0aW9uIChocmVmLCB0aXRsZSwgdGV4dCkge1xuICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBocmVmICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiIHRpdGxlPVwiJyArIHRpdGxlICsgJ1wiPicgKyB0ZXh0ICsgJzwvYT4nO1xuICB9XG4gIG1hcmtlZC5zZXRPcHRpb25zKHtcbiAgICBnZm06IHRydWUsXG4gICAgc2FuaXRpemU6IHRydWUsXG4gICAgdGFibGVzOiB0cnVlLFxuICAgIGJyZWFrczogdHJ1ZSxcbiAgICBwZWRhbnRpYzogZmFsc2UsXG4gICAgc2FuaXRpemU6IGZhbHNlLFxuICAgIHNtYXJ0TGlzdHM6IHRydWUsXG4gICAgc21hcnR5cGFudHM6IHRydWUsXG4gICAgcmVuZGVyZXI6IHJlbmRlcmVyXG4gIH0pXG59XG5cbmZ1bmN0aW9uIERlZmF1bHROb2RlKGNvbnRlbnQsIG1ldGEsIG9wdGlvbnMsIGlzTmV3LCBtb2RlbEFjdGlvbnMpIHtcbiAgQmFzZU5vZGUuY2FsbCh0aGlzLCBjb250ZW50LCBtZXRhLCBvcHRpb25zLCBpc05ldywgbW9kZWxBY3Rpb25zKVxufVxuXG5EZWZhdWx0Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VOb2RlLnByb3RvdHlwZSlcbkRlZmF1bHROb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERlZmF1bHROb2RlXG5cbmZ1bmN0aW9uIHRtZXJnZShhLCBiKSB7XG4gIGZvciAodmFyIGMgaW4gYikge1xuICAgIGFbY10gPSBiW2NdXG4gIH1cbn1cblxuZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHtcbiAgaWYgKCFzdHIpIHJldHVybiAnJztcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3RyKSk7XG4gIHJldHVybiBkaXYuaW5uZXJIVE1MO1xufTtcblxuZnVuY3Rpb24gdW5Fc2NhcGVIdG1sKHN0cikge1xuICBpZiAoIXN0cikgcmV0dXJuICcnO1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoLzxkaXY+L2csICdcXG4nKS5yZXBsYWNlKC88YnI+L2csICdcXG4nKVxuICAgIC5yZXBsYWNlKC88XFwvZGl2Pi9nLCAnJylcbiAgICAucmVwbGFjZSgvXFx1MjAwYi9nLCAnJylcbn1cblxudG1lcmdlKERlZmF1bHROb2RlLnByb3RvdHlwZSwge1xuICBzZXRJbnB1dFZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLmlucHV0LmlubmVySFRNTCA9IHZhbHVlXG4gIH0sXG5cbiAgZ2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB1bkVzY2FwZUh0bWwodGhpcy5pbnB1dC5pbm5lckhUTUwpXG4gIH0sXG5cbiAgZ2V0VmlzaWJsZVZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlucHV0LmZpcnN0Q2hpbGQpIHJldHVybiAnJ1xuICAgIHJldHVybiB0aGlzLmlucHV0LmZpcnN0Q2hpbGQudGV4dENvbnRlbnRcbiAgfSxcblxuICBpc011bHRpTGluZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlucHV0LmlubmVySFRNTC5tYXRjaCgvKDxkaXY+fDxicnxcXG4pL2cpXG4gIH0sXG5cbiAgc3BsaXRSaWdodE9mQ3Vyc29yOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRleHQgPSB0aGlzLmdldFZpc2libGVWYWx1ZSgpXG4gICAgICAsIHMgPSB0aGlzLmdldFNlbGVjdGlvblBvc2l0aW9uKClcbiAgICAgICwgbGVmdCA9IGVzY2FwZUh0bWwodGV4dC5zbGljZSgwLCBzKSlcbiAgICAgICwgcmlnaHQgPSBlc2NhcGVIdG1sKHRleHQuc2xpY2UocykpXG4gICAgaWYgKCFyaWdodCkgcmV0dXJuXG4gICAgdGhpcy5zZXRJbnB1dFZhbHVlKGxlZnQpXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChsZWZ0KVxuICAgIGlmICghdGhpcy5pc05ldykgdGhpcy5vLmNoYW5nZUNvbnRlbnQobGVmdClcbiAgICByZXR1cm4gcmlnaHRcbiAgfSxcblxuICBzZXRUZXh0Q29udGVudDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy50ZXh0LmlubmVySFRNTCA9IHZhbHVlID8gbWFya2VkKHZhbHVlICsgJycpIDogJydcbiAgfSxcblxuICBzZXR1cE5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXG4gICAgdGhpcy5pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5pbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScsIHRydWUpXG4gICAgdGhpcy5pbnB1dC5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faW5wdXQnKVxuXG4gICAgdGhpcy50ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLnRleHQuY2xhc3NMaXN0LmFkZCgndHJlZWRfX3RleHQnKVxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fZGVmYXVsdC1ub2RlJylcblxuICAgIHRoaXMuc2V0VGV4dENvbnRlbnQodGhpcy5jb250ZW50KVxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLnRleHQpXG4gICAgdGhpcy5yZWdpc3Rlckxpc3RlbmVycygpO1xuICB9LFxuXG4gIGlzQXRUb3A6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYmIgPSB0aGlzLmlucHV0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIHNlbHIgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZ2V0UmFuZ2VBdCgwKS5nZXRDbGllbnRSZWN0cygpWzBdXG4gICAgcmV0dXJuIHNlbHIudG9wIDwgYmIudG9wICsgNVxuICB9LFxuXG4gIGlzQXRCb3R0b206IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYmIgPSB0aGlzLmlucHV0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIHNlbHIgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZ2V0UmFuZ2VBdCgwKS5nZXRDbGllbnRSZWN0cygpWzBdXG4gICAgcmV0dXJuIHNlbHIuYm90dG9tID4gYmIuYm90dG9tIC0gNVxuICB9LFxuXG4gIGdldFNlbGVjdGlvblBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuICAgICAgLCByYW4gPSBzZWwuZ2V0UmFuZ2VBdCgwKVxuICAgIHJldHVybiByYW4uc3RhcnRPZmZzZXRcbiAgfSxcblxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uIChmcm9tU3RhcnQpIHtcbiAgICBpZiAodGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICB0aGlzLmVkaXRpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZSh0aGlzLmNvbnRlbnQpXG4gICAgdGhpcy5ub2RlLnJlcGxhY2VDaGlsZCh0aGlzLmlucHV0LCB0aGlzLnRleHQpXG4gICAgdGhpcy5pbnB1dC5mb2N1cygpO1xuICAgIHRoaXMuc2V0U2VsZWN0aW9uKCFmcm9tU3RhcnQpXG4gICAgdGhpcy5vLnNldEVkaXRpbmcoKVxuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIGNvbnNvbGUubG9nKCdzdG9wIGVkZGludCcsIHRoaXMuaXNOZXcpXG4gICAgdmFyIHZhbHVlID0gdGhpcy5nZXRJbnB1dFZhbHVlKClcbiAgICB0aGlzLmVkaXRpbmcgPSBmYWxzZVxuICAgIHRoaXMubm9kZS5yZXBsYWNlQ2hpbGQodGhpcy50ZXh0LCB0aGlzLmlucHV0KVxuICAgIHRoaXMuby5kb25lRWRpdGluZygpO1xuICAgIGlmICh0aGlzLmNvbnRlbnQgIT0gdmFsdWUgfHwgdGhpcy5pc05ldykge1xuICAgICAgdGhpcy5zZXRUZXh0Q29udGVudCh2YWx1ZSlcbiAgICAgIHRoaXMuY29udGVudCA9IHZhbHVlXG4gICAgICB0aGlzLm8uY2hhbmdlQ29udGVudCh0aGlzLmNvbnRlbnQpXG4gICAgfVxuICB9LFxuXG4gIGlzQXRTdGFydDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldFNlbGVjdGlvblBvc2l0aW9uKCkgPT09IDBcbiAgfSxcblxuICBpc0F0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS53YXJuKFwiVEhJUyBJUyBXUk9OR1wiKVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIGFkZEVkaXRUZXh0OiBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBwbCA9IHRoaXMuY29udGVudC5sZW5ndGhcbiAgICB0aGlzLmNvbnRlbnQgKz0gdGV4dFxuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZSh0aGlzLmNvbnRlbnQpXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudCh0aGlzLmNvbnRlbnQpXG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHtcbiAgICAgIHRoaXMuZWRpdGluZyA9IHRydWU7XG4gICAgICB0aGlzLm5vZGUucmVwbGFjZUNoaWxkKHRoaXMuaW5wdXQsIHRoaXMudGV4dClcbiAgICAgIHRoaXMuby5zZXRFZGl0aW5nKCk7XG4gICAgfVxuICAgIHRoaXMuc2V0U2VsZWN0aW9uKHBsKVxuICB9LFxuXG4gIHNldENvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgdGhpcy5jb250ZW50ID0gY29udGVudFxuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShjb250ZW50KVxuICAgIHRoaXMuc2V0VGV4dENvbnRlbnQoY29udGVudClcbiAgfSxcblxuICByZWdpc3Rlckxpc3RlbmVyczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudGV4dC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUudGFyZ2V0Lm5vZGVOYW1lID09ICdBJykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHRoaXMuc3RhcnRFZGl0aW5nKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0uYmluZCh0aGlzKSlcblxuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB0aGlzLnN0b3BFZGl0aW5nKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB2YXIga2V5SGFuZGxlciA9IHRoaXMua2V5SGFuZGxlcigpXG5cbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcmV0dXJuIGtleUhhbmRsZXIoZSlcbiAgICB9KVxuXG4gIH0sXG5cbiAgc2V0U2VsZWN0aW9uOiBmdW5jdGlvbiAoZW5kKSB7XG4gICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuICAgIHNlbC5zZWxlY3RBbGxDaGlsZHJlbih0aGlzLmlucHV0KVxuICAgIHRyeSB7XG4gICAgICBzZWxbJ2NvbGxhcHNlVG8nICsgKGVuZCA/ICdFbmQnIDogJ1N0YXJ0JyldKClcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9LFxuXG59KVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gRHVuZ2VvbnNBbmREcmFnb25zXG5cbmZ1bmN0aW9uIGZpbmRUYXJnZXQodGFyZ2V0cywgZSkge1xuICBmb3IgKHZhciBpPTA7IGk8dGFyZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0YXJnZXRzW2ldLnRvcCA+IGUuY2xpZW50WSkge1xuICAgICAgcmV0dXJuIHRhcmdldHNbaSA+IDAgPyBpLTEgOiAwXVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0c1t0YXJnZXRzLmxlbmd0aC0xXVxufVxuXG4vLyBNYW5hZ2VzIERyYWdnaW5nIE4gRHJvcHBpbmdcbmZ1bmN0aW9uIER1bmdlb25zQW5kRHJhZ29ucyh2bCwgYWN0aW9uLCBmaW5kRnVuY3Rpb24pIHtcbiAgdGhpcy52bCA9IHZsXG4gIHRoaXMuYWN0aW9uID0gYWN0aW9uXG4gIHRoaXMuZmluZEZ1bmN0aW9uID0gZmluZEZ1bmN0aW9uIHx8IGZpbmRUYXJnZXRcbn1cblxuRHVuZ2VvbnNBbmREcmFnb25zLnByb3RvdHlwZSA9IHtcbiAgc3RhcnRNb3Zpbmc6IGZ1bmN0aW9uICh0YXJnZXRzLCBpZCkge1xuICAgIHRoaXMubW92aW5nID0ge1xuICAgICAgdGFyZ2V0czogdGFyZ2V0cyxcbiAgICAgIHNoYWRvdzogdGhpcy52bC5tYWtlRHJvcFNoYWRvdygpLFxuICAgICAgY3VycmVudDogbnVsbFxuICAgIH1cbiAgICB0aGlzLnZsLnNldE1vdmluZyhpZCwgdHJ1ZSlcblxuICAgIHZhciBvbk1vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdGhpcy5kcmFnKGlkLCBlKVxuICAgIH0uYmluZCh0aGlzKVxuXG4gICAgdmFyIG9uVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnJ1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3ZlKVxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uVXApXG4gICAgICB0aGlzLmRyb3AoaWQsIGUpXG4gICAgfS5iaW5kKHRoaXMpXG5cbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICdtb3ZlJ1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW92ZSlcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25VcClcbiAgfSxcblxuICBkcmFnOiBmdW5jdGlvbiAoaWQsIGUpIHtcbiAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudCkge1xuICAgICAgdGhpcy52bC5zZXREcm9wcGluZyh0aGlzLm1vdmluZy5jdXJyZW50LmlkLCBmYWxzZSwgdGhpcy5tb3ZpbmcuY3VycmVudC5wbGFjZSA9PT0gJ2NoaWxkJylcbiAgICB9XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuZmluZEZ1bmN0aW9uKHRoaXMubW92aW5nLnRhcmdldHMsIGUpXG4gICAgdGhpcy5tb3Zpbmcuc2hhZG93Lm1vdmVUbyh0YXJnZXQpXG4gICAgdGhpcy5tb3ZpbmcuY3VycmVudCA9IHRhcmdldFxuICAgIHRoaXMudmwuc2V0RHJvcHBpbmcodGFyZ2V0LmlkLCB0cnVlLCB0aGlzLm1vdmluZy5jdXJyZW50LnBsYWNlID09PSAnY2hpbGQnKVxuICB9LFxuXG4gIGRyb3A6IGZ1bmN0aW9uIChpZCwgZSkge1xuICAgIHRoaXMubW92aW5nLnNoYWRvdy5yZW1vdmUoKVxuICAgIHZhciBjdXJyZW50ID0gdGhpcy5tb3ZpbmcuY3VycmVudFxuICAgIHRoaXMudmwuc2V0TW92aW5nKGlkLCBmYWxzZSlcbiAgICBpZiAoIXRoaXMubW92aW5nLmN1cnJlbnQpIHJldHVyblxuICAgIHRoaXMudmwuc2V0RHJvcHBpbmcoY3VycmVudC5pZCwgZmFsc2UsIGN1cnJlbnQucGxhY2UgPT09ICdjaGlsZCcpXG4gICAgaWYgKGN1cnJlbnQuaWQgPT09IGlkKSByZXR1cm5cbiAgICB0aGlzLmFjdGlvbihjdXJyZW50LnBsYWNlLCBpZCwgY3VycmVudC5pZClcbiAgICB0aGlzLm1vdmluZyA9IGZhbHNlXG4gIH0sXG59XG5cbiIsIlxudmFyIERyb3BTaGFkb3cgPSByZXF1aXJlKCcuL2Ryb3Atc2hhZG93JylcbiAgLCBzbGlkZURvd24gPSByZXF1aXJlKCcuL3NsaWRlLWRvd24nKVxuICAsIHNsaWRlVXAgPSByZXF1aXJlKCcuL3NsaWRlLXVwJylcbiAgLCB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcblxubW9kdWxlLmV4cG9ydHMgPSBEb21WaWV3TGF5ZXJcblxuLyoqXG4gKiBvOiBvcHRpb25zIC0+IHsgTm9kZTogdGhlIGNsYXNzIH1cbiAqL1xuZnVuY3Rpb24gRG9tVmlld0xheWVyKG8pIHtcbiAgdGhpcy5kb20gPSB7fVxuICB0aGlzLnJvb3QgPSBudWxsXG4gIHRoaXMubyA9IHV0aWwubWVyZ2Uoe1xuICAgIGFuaW1hdGU6IHRydWVcbiAgfSwgbylcbn1cblxuRG9tVmlld0xheWVyLnByb3RvdHlwZSA9IHtcbiAgLyoqXG4gICAqIEZvcmdldCBhYm91dCBhbGwgbm9kZXMgLSB0aGV5IHdpbGwgYmUgZGlzcG9zZWQgb2ZcbiAgICovXG4gIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kb20gPSB7fVxuICB9LFxuXG4gIC8qKlxuICAgKiByb290OiB0aGUgb2xkIHJvb3QgdGhhdCBpcyB0byBiZSByZXBsYWNlZFxuICAgKi9cbiAgcmViYXNlOiBmdW5jdGlvbiAocm9vdCkge1xuICAgIGlmIChyb290LnBhcmVudE5vZGUpIHtcbiAgICAgIHJvb3QucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodGhpcy5yb290LCByb290KVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmVjdXJzaXZlbHkgZ2VuZXJhdGUgdGhlIGRyb3AgdGFyZ2V0IGRlZmluaXRpb25zIGZvciBhbGwgb2YgdGhlIHZpc2libGVcbiAgICogbm9kZXMgdW5kZXIgYSBnaXZlbiByb290LlxuICAgKlxuICAgKiByb290OiB0aGUgaWQgb2YgdGhlIG5vZGUgdG8gc3RhcnQgZnJvbVxuICAgKiBtb2RlbDogdGhlIG1vZGVsIC0gdG8gZmluZCBjaGlsZHJlblxuICAgKiBtb3Zpbmc6IHRoZSBpZCBvZiB0aGUgbm9kZSB0aGF0J3MgbW92aW5nIC0gc28gdGhhdCB5b3Ugd29uJ3QgZHJvcCBhIG5vZGVcbiAgICogICAgICAgICBpbnNpZGUgaXRzZWxmXG4gICAqIHRvcDogb25seSB0cnVlIHRoZSBmaXJzdCBjYWxsLCBkZXRlcm1pbmVzIGlmIGl0J3MgdGhlIHJvb3Qgbm9kZSAoZS5nLiBub1xuICAgKiAgICAgIGRyb3AgdGFyZ2V0IGFib3ZlKVxuICAgKi9cbiAgZHJvcFRhcmdldHM6IGZ1bmN0aW9uIChyb290LCBtb2RlbCwgbW92aW5nLCB0b3ApIHtcbiAgICB2YXIgdGFyZ2V0cyA9IFtdXG4gICAgICAsIGJjID0gdGhpcy5kb21bcm9vdF0uaGVhZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgLCB0YXJnZXRcbiAgICAgICwgY2hpbGRUYXJnZXRcblxuICAgIGlmICghdG9wKSB7XG4gICAgICB0YXJnZXRzLnB1c2goe1xuICAgICAgICBpZDogcm9vdCxcbiAgICAgICAgdG9wOiBiYy50b3AsXG4gICAgICAgIGxlZnQ6IGJjLmxlZnQsXG4gICAgICAgIHdpZHRoOiBiYy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBiYy5oZWlnaHQsXG4gICAgICAgIHBsYWNlOiAnYmVmb3JlJyxcbiAgICAgICAgc2hvdzoge1xuICAgICAgICAgIGxlZnQ6IGJjLmxlZnQsLy8gKyAyMCxcbiAgICAgICAgICB3aWR0aDogYmMud2lkdGgsLy8gLSAyMCxcbiAgICAgICAgICB5OiBiYy50b3BcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKHJvb3QgPT09IG1vdmluZykgcmV0dXJuIHRhcmdldHNcblxuICAgIGlmIChtb2RlbC5pc0NvbGxhcHNlZChyb290KSAmJiAhdG9wKSByZXR1cm4gdGFyZ2V0c1xuICAgIHZhciBjaCA9IG1vZGVsLmlkc1tyb290XS5jaGlsZHJlblxuICAgIGlmIChjaCkge1xuICAgICAgZm9yICh2YXIgaT0wOyBpPGNoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRhcmdldHMgPSB0YXJnZXRzLmNvbmNhdCh0aGlzLmRyb3BUYXJnZXRzKGNoW2ldLCBtb2RlbCwgbW92aW5nKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRvcCkge1xuICAgICAgdmFyIGJvZHlCb3ggPSB0aGlzLmRvbVtyb290XS51bC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgdGFyZ2V0cy5wdXNoKHtcbiAgICAgICAgaWQ6IHJvb3QsXG4gICAgICAgIHRvcDogYm9keUJveC5ib3R0b20sXG4gICAgICAgIGxlZnQ6IGJvZHlCb3gubGVmdCxcbiAgICAgICAgd2lkdGg6IGJvZHlCb3gud2lkdGgsXG4gICAgICAgIGhlaWdodDogYmMuaGVpZ2h0LFxuICAgICAgICBwbGFjZTogJ2xhc3RDaGlsZCcsXG4gICAgICAgIHNob3c6IHtcbiAgICAgICAgICBsZWZ0OiBib2R5Qm94LmxlZnQsLy8gKyAyMCxcbiAgICAgICAgICB3aWR0aDogYm9keUJveC53aWR0aCwvLyAtIDIwLFxuICAgICAgICAgIHk6IGJvZHlCb3guYm90dG9tXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB0YXJnZXRzXG4gIH0sXG5cbiAgbWFrZURyb3BTaGFkb3c6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbmV3IERyb3BTaGFkb3coKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBub2RlXG4gICAqXG4gICAqIGlkOiB0aGUgbm9kZSB0byByZW1vdmVcbiAgICogcGlkOiB0aGUgcGFyZW50IGlkXG4gICAqIGxhc3RjaGlsZDogd2hldGhlciB0aGUgbm9kZSB3YXMgdGhlIGxhc3QgY2hpbGRcbiAgICovXG4gIHJlbW92ZTogZnVuY3Rpb24gKGlkLCBwaWQsIGxhc3RjaGlsZCkge1xuICAgIHZhciBuID0gdGhpcy5kb21baWRdXG4gICAgaWYgKCFuIHx8ICFuLm1haW4ucGFyZW50Tm9kZSkgcmV0dXJuXG4gICAgdHJ5IHtcbiAgICAgIG4ubWFpbi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG4ubWFpbilcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZGVsZXRlIHRoaXMuZG9tW2lkXVxuICAgIGlmIChsYXN0Y2hpbGQpIHtcbiAgICAgIHRoaXMuZG9tW3BpZF0ubWFpbi5jbGFzc0xpc3QucmVtb3ZlKCd0cmVlZF9faXRlbS0tcGFyZW50JylcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBhIG5ldyBub2RlIC0gdGhpcyBpcyBwdWJsaWMgZmFjaW5nXG4gICAqXG4gICAqIG5vZGU6IG9iamVjdCBsb29rcyBsaWtlIHtpZDosIGNvbnRlbnQ6LCBtZXRhOiwgcGFyZW50On1cbiAgICogYm91bmRzOiBhbiBvYmplY3Qgb2YgYWN0aW9uIGZ1bmN0aW9uc1xuICAgKiBiZWZvcmU6IHRoZSBpZCBiZWZvcmUgd2hpY2ggdG8gYWRkXG4gICAqIGNoaWxkcmVuOiB3aGV0aGVyIHRoZSBuZXcgbm9kZSBoYXMgY2hpbGRyZW5cbiAgICovXG4gIGFkZE5ldzogZnVuY3Rpb24gKG5vZGUsIGJvdW5kcywgbW9kZWxBY3Rpb25zLCBiZWZvcmUsIGNoaWxkcmVuKSB7XG4gICAgdmFyIGRvbSA9IHRoaXMubWFrZU5vZGUobm9kZS5pZCwgbm9kZS5jb250ZW50LCBub2RlLm1ldGEsIG5vZGUuZGVwdGggLSB0aGlzLnJvb3REZXB0aCwgYm91bmRzLCBtb2RlbEFjdGlvbnMpXG4gICAgdGhpcy5hZGQobm9kZS5wYXJlbnQsIGJlZm9yZSwgZG9tLCBjaGlsZHJlbilcbiAgICBpZiAobm9kZS5jb2xsYXBzZWQgJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIHRoaXMuc2V0Q29sbGFwc2VkKG5vZGUuaWQsIHRydWUpXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgYWRkaW5nIHRoaW5nc1xuICAgKi9cbiAgYWRkOiBmdW5jdGlvbiAocGFyZW50LCBiZWZvcmUsIGRvbSwgY2hpbGRyZW4pIHtcbiAgICB2YXIgcCA9IHRoaXMuZG9tW3BhcmVudF1cbiAgICBpZiAoYmVmb3JlID09PSBmYWxzZSkge1xuICAgICAgcC51bC5hcHBlbmRDaGlsZChkb20pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBiZWYgPSB0aGlzLmRvbVtiZWZvcmVdXG4gICAgICBwLnVsLmluc2VydEJlZm9yZShkb20sIGJlZi5tYWluKVxuICAgIH1cbiAgICBwLm1haW4uY2xhc3NMaXN0LmFkZCgndHJlZWRfX2l0ZW0tLXBhcmVudCcpXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBkb20uY2xhc3NMaXN0LmFkZCgndHJlZWRfX2l0ZW0tLXBhcmVudCcpXG4gICAgfVxuICB9LFxuXG4gIGNsZWFyQ2hpbGRyZW46IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciB1bCA9IHRoaXMuZG9tW2lkXS51bFxuICAgIHdoaWxlICh1bC5sYXN0Q2hpbGQpIHtcbiAgICAgIHVsLnJlbW92ZUNoaWxkKHVsLmxhc3RDaGlsZClcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIGJvZHlcbiAgICovXG4gIGJvZHk6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICghdGhpcy5kb21baWRdKSByZXR1cm5cbiAgICByZXR1cm4gdGhpcy5kb21baWRdLmJvZHlcbiAgfSxcblxuICAvKipcbiAgICogTW92ZSBhIG5vZGUgZnJvbSBvbmUgcGxhY2UgdG8gYW5vdGhlclxuICAgKlxuICAgKiBpZDogICAgICAgIHRoZSBpZCBvZiB0aGUgbm9kZSB0aGF0J3MgbW92aW5nXG4gICAqIHBpZDogICAgICAgdGhlIHBhcmVudCBpZCB0byBtb3ZlIGl0IHRvXG4gICAqIGJlZm9yZTogICAgdGhlIG5vZGUgaWQgYmVmb3JlIHdoaWNoIHRvIG1vdmUgaXQuIGBmYWxzZWAgdG8gYXBwZW5kXG4gICAqIHBwaWQ6ICAgICAgdGhlIHByZXZpb3VzIHBhcmVudCBpZFxuICAgKiBsYXN0Y2hpbGQ6IHdoZXRoZXIgdGhpcyB3YXMgdGhlIGxhc3QgY2hpbGQgb2YgdGhlIHByZXZpb3VzIHBhcmVudFxuICAgKiAgICAgICAgICAgIChsZWF2aW5nIHRoYXQgcGFyZW50IGNoaWxkbGVzcylcbiAgICovXG4gIG1vdmU6IGZ1bmN0aW9uIChpZCwgcGlkLCBiZWZvcmUsIHBwaWQsIGxhc3RjaGlsZCkge1xuICAgIHZhciBkID0gdGhpcy5kb21baWRdXG4gICAgZC5tYWluLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZC5tYWluKVxuICAgIGlmIChsYXN0Y2hpbGQpIHtcbiAgICAgIHRoaXMuZG9tW3BwaWRdLm1haW4uY2xhc3NMaXN0LnJlbW92ZSgndHJlZWRfX2l0ZW0tLXBhcmVudCcpXG4gICAgfVxuICAgIGlmIChiZWZvcmUgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmRvbVtwaWRdLnVsLmFwcGVuZENoaWxkKGQubWFpbilcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb21bcGlkXS51bC5pbnNlcnRCZWZvcmUoZC5tYWluLCB0aGlzLmRvbVtiZWZvcmVdLm1haW4pXG4gICAgfVxuICAgIHRoaXMuZG9tW3BpZF0ubWFpbi5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faXRlbS0tcGFyZW50JylcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBzZWxlY3Rpb24gZnJvbSBhIHNldCBvZiBub2Rlc1xuICAgKlxuICAgKiBzZWxlY3Rpb246IFtpZCwgLi4uXSBub2RlcyB0byBkZXNlbGVjdFxuICAgKi9cbiAgY2xlYXJTZWxlY3Rpb246IGZ1bmN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8c2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXRoaXMuZG9tW3NlbGVjdGlvbltpXV0pIGNvbnRpbnVlO1xuICAgICAgdGhpcy5kb21bc2VsZWN0aW9uW2ldXS5tYWluLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJylcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNob3cgdGhlIHNlbGVjdGlvbiBvbiBhIHNldCBvZiBub2Rlc1xuICAgKlxuICAgKiBzZWxlY3Rpb246IFtpZCwgLi4uXSBub2RlcyB0byBzZWxlY3RcbiAgICovXG4gIHNob3dTZWxlY3Rpb246IGZ1bmN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICBpZiAoIXNlbGVjdGlvbi5sZW5ndGgpIHJldHVyblxuICAgIC8vIHV0aWwuZW5zdXJlSW5WaWV3KHRoaXMuZG9tW3NlbGVjdGlvblswXV0uYm9keS5ub2RlKVxuICAgIGZvciAodmFyIGk9MDsgaTxzZWxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuZG9tW3NlbGVjdGlvbltpXV0ubWFpbi5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpXG4gICAgfVxuICB9LFxuXG4gIGNsZWFyQWN0aXZlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoIXRoaXMuZG9tW2lkXSkgcmV0dXJuXG4gICAgdGhpcy5kb21baWRdLm1haW4uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJylcbiAgfSxcblxuICBzaG93QWN0aXZlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoIXRoaXMuZG9tW2lkXSkgcmV0dXJuIGNvbnNvbGUud2FybignVHJ5aW5nIHRvIGFjdGl2YXRlIGEgbm9kZSB0aGF0IGlzIG5vdCByZW5kZXJlZCcpXG4gICAgdXRpbC5lbnN1cmVJblZpZXcodGhpcy5kb21baWRdLmJvZHkubm9kZSlcbiAgICB0aGlzLmRvbVtpZF0ubWFpbi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICB9LFxuXG4gIHNldENvbGxhcHNlZDogZnVuY3Rpb24gKGlkLCBpc0NvbGxhcHNlZCkge1xuICAgIHRoaXMuZG9tW2lkXS5tYWluLmNsYXNzTGlzdFtpc0NvbGxhcHNlZCA/ICdhZGQnIDogJ3JlbW92ZSddKCdjb2xsYXBzZWQnKVxuICB9LFxuXG4gIGFuaW1hdGVPcGVuOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB0aGlzLnNldENvbGxhcHNlZChpZCwgZmFsc2UpXG4gICAgc2xpZGVEb3duKHRoaXMuZG9tW2lkXS51bClcbiAgfSxcblxuICBhbmltYXRlQ2xvc2VkOiBmdW5jdGlvbiAoaWQsIGRvbmUpIHtcbiAgICBzbGlkZVVwKHRoaXMuZG9tW2lkXS51bCwgZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXRDb2xsYXBzZWQoaWQsIHRydWUpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIHNldE1vdmluZzogZnVuY3Rpb24gKGlkLCBpc01vdmluZykge1xuICAgIHRoaXMucm9vdC5jbGFzc0xpc3RbaXNNb3ZpbmcgPyAnYWRkJyA6ICdyZW1vdmUnXSgnbW92aW5nJylcbiAgICB0aGlzLmRvbVtpZF0ubWFpbi5jbGFzc0xpc3RbaXNNb3ZpbmcgPyAnYWRkJyA6ICdyZW1vdmUnXSgnbW92aW5nJylcbiAgfSxcblxuICBzZXREcm9wcGluZzogZnVuY3Rpb24gKGlkLCBpc0Ryb3BwaW5nLCBpc0NoaWxkKSB7XG4gICAgdmFyIGNscyA9ICdkcm9wcGluZycgKyAoaXNDaGlsZCA/ICctY2hpbGQnIDogJycpXG4gICAgdGhpcy5kb21baWRdLm1haW4uY2xhc3NMaXN0W2lzRHJvcHBpbmcgPyAnYWRkJyA6ICdyZW1vdmUnXShjbHMpXG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgcm9vdCBub2RlXG4gICAqL1xuICBtYWtlUm9vdDogZnVuY3Rpb24gKG5vZGUsIGJvdW5kcywgbW9kZWxBY3Rpb25zKSB7XG4gICAgdmFyIGRvbSA9IHRoaXMubWFrZU5vZGUobm9kZS5pZCwgbm9kZS5jb250ZW50LCBub2RlLm1ldGEsIDAsIGJvdW5kcywgbW9kZWxBY3Rpb25zKVxuICAgICAgLCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICByb290LmNsYXNzTGlzdC5hZGQoJ3RyZWVkJylcbiAgICByb290LmFwcGVuZENoaWxkKGRvbSlcbiAgICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIGRvbS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faXRlbS0tcGFyZW50JylcbiAgICB9XG4gICAgaWYgKG5vZGUuY29sbGFwc2VkICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnNldENvbGxhcHNlZChub2RlLmlkLCB0cnVlKVxuICAgIH1cbiAgICB0aGlzLnJvb3QgPSByb290XG4gICAgdGhpcy5yb290RGVwdGggPSBub2RlLmRlcHRoXG4gICAgcmV0dXJuIHJvb3RcbiAgfSxcblxuICAvKipcbiAgICogTWFrZSB0aGUgaGVhZCBmb3IgYSBnaXZlbiBub2RlXG4gICAqL1xuICBtYWtlSGVhZDogZnVuY3Rpb24gKGJvZHksIGFjdGlvbnMpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAsIGNvbGxhcHNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cbiAgICBjb2xsYXBzZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLmJ1dHRvbiAhPT0gMCkgcmV0dXJuXG4gICAgICBhY3Rpb25zLnRvZ2dsZUNvbGxhcHNlKClcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIH0pXG4gICAgY29sbGFwc2VyLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19jb2xsYXBzZXInKVxuXG4gICAgLypcbiAgICAvLyAgLCBtb3ZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgbW92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLmJ1dHRvbiAhPT0gMCkgcmV0dXJuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIGFjdGlvbnMuc3RhcnRNb3ZpbmcoKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSlcbiAgICBtb3Zlci5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fbW92ZXInKVxuICAgIC8vIGhlYWQuYXBwZW5kQ2hpbGQobW92ZXIpXG4gICAgKi9cblxuICAgIGhlYWQuY2xhc3NMaXN0LmFkZCgndHJlZWRfX2hlYWQnKVxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoY29sbGFwc2VyKVxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoYm9keS5ub2RlKTtcbiAgICByZXR1cm4gaGVhZFxuICB9LFxuXG4gIC8qKlxuICAgKiBNYWtlIGEgbm9kZVxuICAgKi9cbiAgbWFrZU5vZGU6IGZ1bmN0aW9uIChpZCwgY29udGVudCwgbWV0YSwgbGV2ZWwsIGJvdW5kcywgbW9kZWxBY3Rpb25zKSB7XG4gICAgdmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICAgICwgYm9keSA9IHRoaXMuYm9keUZvcihpZCwgY29udGVudCwgbWV0YSwgYm91bmRzLCBtb2RlbEFjdGlvbnMpXG5cbiAgICBkb20uY2xhc3NMaXN0LmFkZCgndHJlZWRfX2l0ZW0nKVxuICAgIC8vIGRvbS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9faXRlbS0tbGV2ZWwtJyArIGxldmVsKVxuXG4gICAgdmFyIGhlYWQgPSB0aGlzLm1ha2VIZWFkKGJvZHksIGJvdW5kcylcbiAgICBkb20uYXBwZW5kQ2hpbGQoaGVhZClcblxuICAgIHZhciB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJylcbiAgICB1bC5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fY2hpbGRyZW4nKVxuICAgIGRvbS5hcHBlbmRDaGlsZCh1bClcbiAgICB0aGlzLmRvbVtpZF0gPSB7bWFpbjogZG9tLCBib2R5OiBib2R5LCB1bDogdWwsIGhlYWQ6IGhlYWR9XG4gICAgcmV0dXJuIGRvbVxuICB9LFxuXG4gIC8qKiBcbiAgICogQ3JlYXRlIGEgYm9keSBub2RlXG4gICAqXG4gICAqIGlkOiB0aGUgbm9kZSBpZlxuICAgKiBjb250ZW50OiB0aGUgdGV4dFxuICAgKiBtZXRhOiBhbiBvYmplY3Qgb2YgbWV0YSBkYXRhXG4gICAqIGJvdW5kczogYm91bmQgYWN0aW9uc1xuICAgKi9cbiAgYm9keUZvcjogZnVuY3Rpb24gKGlkLCBjb250ZW50LCBtZXRhLCBib3VuZHMsIG1vZGVsQWN0aW9ucykge1xuICAgIHZhciBkb20gPSBuZXcgdGhpcy5vLk5vZGUoY29udGVudCwgbWV0YSwgYm91bmRzLCBpZCA9PT0gJ25ldycsIG1vZGVsQWN0aW9ucylcbiAgICBkb20ubm9kZS5jbGFzc0xpc3QuYWRkKCd0cmVlZF9fYm9keScpXG4gICAgcmV0dXJuIGRvbVxuICB9LFxuXG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBEcm9wU2hhZG93O1xuXG5mdW5jdGlvbiBEcm9wU2hhZG93KGhlaWdodCwgY2xzTmFtZSkge1xuICB0aGlzLm5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB0aGlzLm5vZGUuY2xhc3NMaXN0LmFkZChjbHNOYW1lIHx8ICd0cmVlZF9fZHJvcC1zaGFkb3cnKVxuICB0aGlzLmhlaWdodCA9IGhlaWdodCB8fCAxMFxuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubm9kZSlcbn1cblxuRHJvcFNoYWRvdy5wcm90b3R5cGUgPSB7XG4gIG1vdmVUbzogZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIHRoaXMubm9kZS5zdHlsZS50b3AgPSB0YXJnZXQuc2hvdy55IC0gdGhpcy5oZWlnaHQvMiArICdweCdcbiAgICB0aGlzLm5vZGUuc3R5bGUubGVmdCA9IHRhcmdldC5zaG93LmxlZnQgKyAncHgnXG4gICAgdGhpcy5ub2RlLnN0eWxlLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgJ3B4J1xuICAgIC8vIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSB0YXJnZXQuaGVpZ2h0ICsgMTAgKyAncHgnXG4gICAgdGhpcy5ub2RlLnN0eWxlLndpZHRoID0gdGFyZ2V0LnNob3cud2lkdGggKyAncHgnXG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlKVxuICB9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIE5vZGU6IHJlcXVpcmUoJy4vZGVmYXVsdC1ub2RlJyksXG4gIFZpZXc6IHJlcXVpcmUoJy4vdmlldycpLFxuICBWaWV3TGF5ZXI6IHJlcXVpcmUoJy4vZG9tLXZsJyksXG4gIE1vZGVsOiByZXF1aXJlKCcuL21vZGVsJyksXG4gIENvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcicpLFxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ga2V5SGFuZGxlclxuXG4vKipcbiAqIE9yZ2FuaXplIHRoZSBrZXlzIGRlZmluaXRpb24sIHRoZSBhY3Rpb25zIGRlZmluaXRpb24sIGFuZCB0aGUgY3RybGFjdGlvbnNcbiAqIGFsbCB0b2dldGhlciBpbiBvbmUgbG92ZWx5IHNtb3JnYXNib3JkLlxuICpcbiAqIGtleXM6IHthY3Rpb246IGtleSBzaG9ydGN1dCBkZWZpbml0aW9ufVxuICogYWN0aW9uczoge2FjdGlvbjoge2FjdGlvbiBkZWZpbml0aW9ufX1cbiAqIGN0cmxhY3Rpb25zOiB7bmFtZTogZnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGtleUhhbmRsZXIoa2V5cywgYWN0aW9ucywgY3RybGFjdGlvbnMpIHtcbiAgdmFyIGJvdW5kID0ge31cbiAgZm9yICh2YXIgYWN0aW9uIGluIGtleXMpIHtcbiAgICBpZiAoIWFjdGlvbnNbYWN0aW9uXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGNvbmZpZ3VyYXRpb246IHRyeWluZyB0byBiaW5kIHVua25vd24gYWN0aW9uLiAnICsgYWN0aW9uKVxuICAgIH1cbiAgICBib3VuZFtrZXlzW2FjdGlvbl1dID0gYmluZEFjdGlvbihhY3Rpb24sIGFjdGlvbnNbYWN0aW9uXSwgY3RybGFjdGlvbnMpXG4gIH1cbiAgcmV0dXJuIGJvdW5kXG59XG5cbmZ1bmN0aW9uIGJpbmRBY3Rpb24obmFtZSwgYWN0aW9uLCBjdHJsYWN0aW9ucykge1xuICB2YXIgcHJlID0gbWFrZVByZShhY3Rpb24uYWN0aXZlKVxuICB2YXIgdHlwZSA9IHR5cGVvZiBhY3Rpb24uYWN0aW9uXG4gIHZhciBtYWluXG4gIHN3aXRjaCAodHlwZW9mIGFjdGlvbi5hY3Rpb24pIHtcbiAgICBjYXNlICdzdHJpbmcnOiBtYWluID0gY3RybGFjdGlvbnNbYWN0aW9uLmFjdGlvbl07IGJyZWFrO1xuICAgIGNhc2UgJ3VuZGVmaW5lZCc6IG1haW4gPSBjdHJsYWN0aW9uc1tjYW1lbChuYW1lKV07IGJyZWFrO1xuICAgIGNhc2UgJ2Z1bmN0aW9uJzogbWFpbiA9IGFjdGlvbi5hY3Rpb247IGJyZWFrO1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcigndW5rbm93biBhY3Rpb24gJyArIGFjdGlvbi5hY3Rpb24pXG4gIH1cblxuICBpZiAoIW1haW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYWN0aW9uIGNvbmZpZ3VyYXRpb24gJyArIG5hbWUpXG4gIH1cblxuICBpZiAoIXByZSkge1xuICAgIHJldHVybiBtYWluXG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICghcHJlLmNhbGwodGhpcykpIHJldHVyblxuICAgIHJldHVybiBtYWluLmNhbGwodGhpcywgdGhpcy5hY3RpdmUpXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVByZShhY3RpdmUpIHtcbiAgc3dpdGNoIChhY3RpdmUpIHtcbiAgICBjYXNlIHRydWU6IHJldHVybiBmdW5jdGlvbihtYWluKSB7XG4gICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICB9XG4gICAgY2FzZSAnIW5ldyc6IHJldHVybiBmdW5jdGlvbiAobWFpbikge1xuICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlICE9PSAnbmV3J1xuICAgIH1cbiAgICBjYXNlICchcm9vdCc6IHJldHVybiBmdW5jdGlvbiAobWFpbikge1xuICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlICE9PSB0aGlzLnJvb3RcbiAgICB9XG4gICAgZGVmYXVsdDogcmV0dXJuIG51bGxcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW1lbChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8gKFxcdykvLCBmdW5jdGlvbiAoYSwgeCkgeyByZXR1cm4geC50b1VwcGVyQ2FzZSgpIH0pXG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBrZXlzXG5cbmtleXMua2V5TmFtZSA9IGtleU5hbWVcblxudmFyIEtFWVMgPSB7XG4gIDg6ICdiYWNrc3BhY2UnLFxuICA5OiAndGFiJyxcbiAgMTM6ICdyZXR1cm4nLFxuICAyNzogJ2VzY2FwZScsXG4gIDM3OiAnbGVmdCcsXG4gIDM4OiAndXAnLFxuICAzOTogJ3JpZ2h0JyxcbiAgNDA6ICdkb3duJyxcbiAgNDY6ICdkZWxldGUnLFxuICAxMTM6ICdmMicsXG4gIDIxOTogJ1snLFxuICAyMjE6ICddJ1xufVxuXG5mdW5jdGlvbiBrZXlOYW1lKGNvZGUpIHtcbiAgaWYgKGNvZGUgPD0gOTAgJiYgY29kZSA+PSA2NSkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUgKyAzMilcbiAgfVxuICBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSlcbiAgfVxuICByZXR1cm4gS0VZU1tjb2RlXVxufVxuXG5mdW5jdGlvbiBrZXlzKGNvbmZpZykge1xuICB2YXIga21hcCA9IHt9XG4gICAgLCBwcmVmaXhlcyA9IHt9XG4gICAgLCBjdXJfcHJlZml4ID0gbnVsbFxuICAgICwgcGFydHNcbiAgICAsIHBhcnRcbiAgICAsIHNlcVxuICBmb3IgKHZhciBrZXkgaW4gY29uZmlnKSB7XG4gICAgcGFydHMgPSBrZXkuc3BsaXQoJywnKVxuICAgIGZvciAodmFyIGk9MDtpPHBhcnRzLmxlbmd0aDtpKyspIHtcbiAgICAgIHBhcnQgPSBwYXJ0c1tpXS50cmltKClcbiAgICAgIGttYXBbcGFydF0gPSBjb25maWdba2V5XVxuICAgICAgaWYgKHBhcnQuaW5kZXhPZignICcpICE9PSAtMSkge1xuICAgICAgICBzZXEgPSBwYXJ0LnNwbGl0KC9cXHMrL2cpXG4gICAgICAgIHZhciBuID0gJydcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHNlcS5sZW5ndGgtMTsgaisrKSB7XG4gICAgICAgICAgbiArPSBzZXFbal1cbiAgICAgICAgICBwcmVmaXhlc1tuXSA9IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIga2V5ID0ga2V5TmFtZShlLmtleUNvZGUpXG4gICAgaWYgKCFrZXkpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlLmtleUNvZGUpXG4gICAgfVxuICAgIGlmIChlLmFsdEtleSkga2V5ID0gJ2FsdCsnICsga2V5XG4gICAgaWYgKGUuc2hpZnRLZXkpIGtleSA9ICdzaGlmdCsnICsga2V5XG4gICAgaWYgKGUuY3RybEtleSkga2V5ID0gJ2N0cmwrJyArIGtleVxuICAgIGlmIChlLm1ldGFLZXkpIGtleSA9ICdjbWQrJyArIGtleVxuICAgIGlmIChjdXJfcHJlZml4KSB7XG4gICAgICBrZXkgPSBjdXJfcHJlZml4ICsgJyAnICsga2V5XG4gICAgICBjdXJfcHJlZml4ID0gbnVsbFxuICAgIH1cbiAgICBpZiAoIWttYXBba2V5XSkge1xuICAgICAgaWYgKHByZWZpeGVzW2tleV0pIHtcbiAgICAgICAgY3VyX3ByZWZpeCA9IGtleVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VyX3ByZWZpeCA9IG51bGxcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoa21hcFtrZXldLmNhbGwodGhpcywgZSkgIT09IHRydWUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG59XG5cblxuIiwiXG52YXIgdXVpZCA9IHJlcXVpcmUoJy4vdXVpZCcpXG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWxcblxuZnVuY3Rpb24gTW9kZWwocm9vdE5vZGUsIGlkcywgZGIpIHtcbiAgdGhpcy5pZHMgPSBpZHNcbiAgdGhpcy5yb290ID0gcm9vdE5vZGUuaWRcbiAgdGhpcy5yb290Tm9kZSA9IHJvb3ROb2RlXG4gIHRoaXMuZGIgPSBkYlxuICB0aGlzLm5leHRpZCA9IDEwMFxuICB0aGlzLmNsaXBib2FyZCA9IGZhbHNlXG4gIHRoaXMuYm91bmRBY3Rpb25zID0gdGhpcy5iaW5kQWN0aW9ucygpXG59XG5cbi8qKlxuICogQSBzaW5nbGUgbm9kZSBpc1xuICogLSBpZDpcbiAqIC0gcGFyZW50OiBpZFxuICogLSBjaGlsZHJlbjogW2lkLCBpZCwgaWRdXG4gKiAtIGRhdGE6IHt9XG4gKi9cblxuTW9kZWwucHJvdG90eXBlID0ge1xuICBuZXdpZDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB1dWlkKCk7XG4gICAgLypcbiAgICB3aGlsZSAodGhpcy5pZHNbdGhpcy5uZXh0aWRdKSB7XG4gICAgICB0aGlzLm5leHRpZCArPSAxXG4gICAgfVxuICAgIHZhciBpZCA9IHRoaXMubmV4dGlkXG4gICAgdGhpcy5uZXh0aWQgKz0gMVxuICAgIHJldHVybiBpZCArICcnXG4gICAgKi9cbiAgfSxcblxuICBiaW5kQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBib3VuZCA9IHt9XG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLmFjdGlvbnMpIHtcbiAgICAgIGJvdW5kW25hbWVdID0gdGhpcy5hY3Rpb25zW25hbWVdLmJpbmQodGhpcylcbiAgICB9XG4gICAgcmV0dXJuIGJvdW5kXG4gIH0sXG5cbiAgYWN0aW9uczoge30sXG5cbiAgLy8gZXhwb3J0IGFsbCB0aGUgZGF0YSBjdXJyZW50bHkgc3RvcmVkIGluIHRoZSBtb2RlbFxuICAvLyBkdW1wRGF0YSgpIC0+IGFsbCBvZiBpdFxuICAvLyBkdW1wRGF0YShpZCkgLT4gY2hpbGRyZW4gb2YgdGhlIGdpdmVuIGlkXG4gIC8vIGR1bXBEYXRhKGlkLCB0cnVlKSAtPiBpbmNsdWRlIHRoZSBpZHMgaW4gdGhlIGR1bXBcbiAgLy8ge1xuICAvLyAgICBpZDogPz8sXG4gIC8vICAgIG1ldGE6IHt9LFxuICAvLyAgICBjb2xsYXBzZWQ6ID8/LFxuICAvLyAgICBjb250ZW50OiAnJyxcbiAgLy8gICAgY2hpbGRyZW46IFtyZWN1cnNlLCAuLi5dXG4gIC8vIH1cbiAgZHVtcERhdGE6IGZ1bmN0aW9uIChpZCwgbm9pZHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWQgPSB0aGlzLnJvb3RcbiAgICB9XG4gICAgdmFyIHJlcyA9IHtcbiAgICAgICAgICBtZXRhOiB7fSxcbiAgICAgICAgfVxuICAgICAgLCBuID0gdGhpcy5pZHNbaWRdXG4gICAgcmVzLmNvbnRlbnQgPSBuLmNvbnRlbnRcbiAgICByZXMuY3JlYXRlZCA9IG4uY3JlYXRlZFxuICAgIHJlcy50eXBlID0gbi50eXBlXG4gICAgcmVzLm1vZGlmaWVkID0gbi5tb2RpZmllZFxuICAgIGZvciAodmFyIGF0dHIgaW4gbi5tZXRhKSB7XG4gICAgICByZXMubWV0YVthdHRyXSA9IG4ubWV0YVthdHRyXVxuICAgIH1cbiAgICBpZiAobi5jaGlsZHJlbiAmJiBuLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcmVzLmNoaWxkcmVuID0gW11cbiAgICAgIGZvciAodmFyIGk9MDsgaTxuLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlcy5jaGlsZHJlbi5wdXNoKHRoaXMuZHVtcERhdGEobi5jaGlsZHJlbltpXSwgbm9pZHMpKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW5vaWRzKSByZXMuaWQgPSBpZFxuICAgIHJlcy5jb2xsYXBzZWQgPSBuLmNvbGxhcHNlZCB8fCBmYWxzZVxuICAgIHJldHVybiByZXNcbiAgfSxcblxuICAvLyBjcmVhdGVOb2RlcyhwYXJlbnRJZCwgdGhlIGluZGV4LCBkYXRhIGFzIGl0IHdhcyBkdW1wZWQpXG4gIC8vIHtcbiAgLy8gICAgY29udGVudDogXCJcIixcbiAgLy8gICAgbWV0YToge31cbiAgLy8gICAgLi4uIG90aGVyIGRhdGFzXG4gIC8vICAgIGNoaWxkcmVuOiBbbm9kZSwgLi4uXVxuICAvLyB9XG4gIGNyZWF0ZU5vZGVzOiBmdW5jdGlvbiAocGlkLCBpbmRleCwgZGF0YSkge1xuICAgIHZhciBjciA9IHRoaXMuY3JlYXRlKHBpZCwgaW5kZXgsIGRhdGEuY29udGVudCwgZGF0YS50eXBlLCBkYXRhLm1ldGEpXG4gICAgY3Iubm9kZS5jb2xsYXBzZWQgPSBkYXRhLmNvbGxhcHNlZCB8fCBmYWxzZVxuICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmNyZWF0ZU5vZGVzKGNyLm5vZGUuaWQsIGksIGRhdGEuY2hpbGRyZW5baV0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjclxuICB9LFxuXG4gIGdldEJlZm9yZTogZnVuY3Rpb24gKHBpZCwgaW5kZXgpIHtcbiAgICB2YXIgYmVmb3JlID0gZmFsc2VcbiAgICBpZiAoaW5kZXggPCB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgIGJlZm9yZSA9IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW5baW5kZXggKyAxXVxuICAgIH1cbiAgICByZXR1cm4gYmVmb3JlXG4gIH0sXG5cbiAgLy8gb3BlcmF0aW9uc1xuICBjcmVhdGU6IGZ1bmN0aW9uIChwaWQsIGluZGV4LCB0ZXh0LCB0eXBlLCBtZXRhKSB7XG4gICAgdmFyIG5vZGUgPSB7XG4gICAgICBpZDogdGhpcy5uZXdpZCgpLFxuICAgICAgY29udGVudDogdGV4dCB8fCAnJyxcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICB0eXBlOiB0eXBlIHx8ICdiYXNlJyxcbiAgICAgIG1ldGE6IG1ldGEgfHwge30sXG4gICAgICBwYXJlbnQ6IHBpZCxcbiAgICAgIGNoaWxkcmVuOiBbXVxuICAgIH1cbiAgICB0aGlzLmlkc1tub2RlLmlkXSA9IG5vZGVcbiAgICBpZiAoIXRoaXMuaWRzW3BpZF0uY2hpbGRyZW4pIHtcbiAgICAgIHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4gPSBbXVxuICAgIH1cbiAgICB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLnNwbGljZShpbmRleCwgMCwgbm9kZS5pZClcblxuICAgIHZhciBiZWZvcmUgPSBmYWxzZVxuICAgIGlmIChpbmRleCA8IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xuICAgICAgYmVmb3JlID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbltpbmRleCArIDFdXG4gICAgfVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kYi5zYXZlKCdub2RlJywgbm9kZS5pZCwgbm9kZSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIHBpZCwge2NoaWxkcmVuOiB0aGlzLmlkc1twaWRdLmNoaWxkcmVufSlcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICByZXR1cm4ge1xuICAgICAgbm9kZTogbm9kZSxcbiAgICAgIGJlZm9yZTogYmVmb3JlXG4gICAgfVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKGlkID09PSB0aGlzLnJvb3QpIHJldHVyblxuICAgIHZhciBuID0gdGhpcy5pZHNbaWRdXG4gICAgICAsIHAgPSB0aGlzLmlkc1tuLnBhcmVudF1cbiAgICAgICwgaXggPSBwLmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgcC5jaGlsZHJlbi5zcGxpY2UoaXgsIDEpXG4gICAgZGVsZXRlIHRoaXMuaWRzW2lkXVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmRiLnJlbW92ZSgnbm9kZScsIGlkKVxuICAgICAgdGhpcy5kYi51cGRhdGUoJ25vZGUnLCBuLnBhcmVudCwge2NoaWxkcmVuOiBwLmNoaWxkcmVufSlcbiAgICAgIC8vIFRPRE86IHJlbW92ZSBhbGwgY2hpbGQgbm9kZXNcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICByZXR1cm4ge2lkOiBpZCwgbm9kZTogbiwgaXg6IGl4fVxuICB9LFxuXG4gIHNldENvbnRlbnQ6IGZ1bmN0aW9uIChpZCwgY29udGVudCkge1xuICAgIHRoaXMuaWRzW2lkXS5jb250ZW50ID0gY29udGVudFxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgaWQsIHtjb250ZW50OiBjb250ZW50fSlcbiAgfSxcblxuICBzZXRBdHRyOiBmdW5jdGlvbiAoaWQsIGF0dHIsIHZhbHVlKSB7XG4gICAgdGhpcy5pZHNbaWRdLm1ldGFbYXR0cl0gPSB2YWx1ZVxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgaWQsIHttZXRhOiB0aGlzLmlkc1tpZF0ubWV0YX0pXG4gIH0sXG5cbiAgc2V0TWV0YTogZnVuY3Rpb24gKGlkLCBtZXRhKSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBtZXRhKSB7XG4gICAgICB0aGlzLmlkc1tpZF0ubWV0YVthdHRyXSA9IG1ldGFbYXR0cl1cbiAgICB9XG4gICAgdGhpcy5kYi51cGRhdGUoJ25vZGUnLCBpZCwge21ldGE6IG1ldGF9KVxuICB9LFxuXG4gIC8vIG90aGVyIHN0dWZmXG4gIHNldENvbGxhcHNlZDogZnVuY3Rpb24gKGlkLCBpc0NvbGxhcHNlZCkge1xuICAgIHRoaXMuaWRzW2lkXS5jb2xsYXBzZWQgPSBpc0NvbGxhcHNlZFxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgaWQsIHtjb2xsYXBzZWQ6IGlzQ29sbGFwc2VkfSlcbiAgfSxcblxuICBpc0NvbGxhcHNlZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5jb2xsYXBzZWRcbiAgfSxcblxuICBoYXNDaGlsZHJlbjogZnVuY3Rpb24gKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5jaGlsZHJlbiAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoXG4gIH0sXG5cbiAgLy8gYWRkIGJhY2sgc29tZXRoaW5nIHRoYXQgd2FzIHJlbW92ZWRcbiAgcmVhZGQ6IGZ1bmN0aW9uIChzYXZlZCkge1xuICAgIHRoaXMuaWRzW3NhdmVkLmlkXSA9IHNhdmVkLm5vZGVcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmlkc1tzYXZlZC5ub2RlLnBhcmVudF0uY2hpbGRyZW5cbiAgICBjaGlsZHJlbi5zcGxpY2Uoc2F2ZWQuaXgsIDAsIHNhdmVkLmlkKVxuICAgIHZhciBiZWZvcmUgPSBmYWxzZVxuICAgIGlmIChzYXZlZC5peCA8IGNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgIGJlZm9yZSA9IGNoaWxkcmVuW3NhdmVkLml4ICsgMV1cbiAgICB9XG4gICAgdGhpcy5kYi5zYXZlKCdub2RlJywgc2F2ZWQubm9kZS5pZCwgc2F2ZWQubm9kZSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIHNhdmVkLm5vZGUucGFyZW50LCB7Y2hpbGRyZW46IGNoaWxkcmVufSlcbiAgICByZXR1cm4gYmVmb3JlXG4gIH0sXG5cbiAgbW92ZTogZnVuY3Rpb24gKGlkLCBwaWQsIGluZGV4KSB7XG4gICAgdmFyIG4gPSB0aGlzLmlkc1tpZF1cbiAgICAgICwgb3BpZCA9IG4ucGFyZW50XG4gICAgICAsIHAgPSB0aGlzLmlkc1tvcGlkXVxuICAgICAgLCBpeCA9IHAuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICBwLmNoaWxkcmVuLnNwbGljZShpeCwgMSlcbiAgICBpZiAoIXRoaXMuaWRzW3BpZF0uY2hpbGRyZW4pIHtcbiAgICAgIHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4gPSBbXVxuICAgIH1cbiAgICBpZiAoaW5kZXggPT09IGZhbHNlKSBpbmRleCA9IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoXG4gICAgdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDAsIGlkKVxuICAgIHRoaXMuaWRzW2lkXS5wYXJlbnQgPSBwaWRcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgb3BpZCwge2NoaWxkcmVuOiBwLmNoaWxkcmVufSlcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7cGFyZW50OiBwaWR9KVxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgcGlkLCB7Y2hpbGRyZW46IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW59KVxuICAgIH0uYmluZCh0aGlzKSlcblxuICAgIHZhciBiZWZvcmUgPSBmYWxzZVxuICAgIGlmIChpbmRleCA8IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xuICAgICAgYmVmb3JlID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbltpbmRleCArIDFdXG4gICAgfVxuICAgIHJldHVybiBiZWZvcmVcbiAgfSxcblxuICBhcHBlbmRUZXh0OiBmdW5jdGlvbiAoaWQsIHRleHQpIHtcbiAgICB0aGlzLmlkc1tpZF0uY29udGVudCArPSB0ZXh0XG4gICAgdGhpcy5kYi51cGRhdGUoJ25vZGUnLCBpZCwge2NvbnRlbnQ6IHRoaXMuaWRzW2lkXS5jb250ZW50fSlcbiAgfSxcblxuICAvLyBtb3ZlbWVudCBjYWxjdWxhdGlvblxuICBnZXRQYXJlbnQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiB0aGlzLmlkc1tpZF0ucGFyZW50XG4gIH0sXG5cbiAgY29tbW9uUGFyZW50OiBmdW5jdGlvbiAob25lLCB0d28pIHtcbiAgICBpZiAob25lID09PSB0d28pIHJldHVybiBvbmVcbiAgICB2YXIgb25lcyA9IFtvbmVdXG4gICAgICAsIHR3b3MgPSBbdHdvXVxuICAgIHdoaWxlICh0aGlzLmlkc1tvbmVdLnBhcmVudCB8fCB0aGlzLmlkc1t0d29dLnBhcmVudCkge1xuICAgICAgaWYgKHRoaXMuaWRzW29uZV0ucGFyZW50KSB7XG4gICAgICAgIG9uZSA9IHRoaXMuaWRzW29uZV0ucGFyZW50XG4gICAgICAgIGlmICh0d29zLmluZGV4T2Yob25lKSAhPT0gLTEpIHJldHVybiBvbmVcbiAgICAgICAgb25lcy5wdXNoKG9uZSlcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlkc1t0d29dLnBhcmVudCkge1xuICAgICAgICB0d28gPSB0aGlzLmlkc1t0d29dLnBhcmVudFxuICAgICAgICBpZiAob25lcy5pbmRleE9mKHR3bykgIT09IC0xKSByZXR1cm4gdHdvXG4gICAgICAgIHR3b3MucHVzaCh0d28pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgZ2V0Q2hpbGQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICh0aGlzLmlkc1tpZF0uY2hpbGRyZW4gJiYgdGhpcy5pZHNbaWRdLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5jaGlsZHJlblswXVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5uZXh0U2libGluZyhpZClcbiAgfSxcblxuICBwcmV2U2libGluZzogZnVuY3Rpb24gKGlkLCBub3BhcmVudCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gcGlkKSByZXR1cm5cbiAgICB2YXIgaXggPSB0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4ID4gMCkgcmV0dXJuIHRoaXMuaWRzW3BpZF0uY2hpbGRyZW5baXgtMV1cbiAgICBpZiAoIW5vcGFyZW50KSByZXR1cm4gcGlkXG4gIH0sXG5cbiAgY2xvc2VzdE5vbkNoaWxkOiBmdW5jdGlvbiAoaWQsIG90aGVycykge1xuICAgIHZhciBjbG9zZXN0ID0gdGhpcy5uZXh0U2libGluZyhpZCwgdHJ1ZSlcbiAgICBpZiAodW5kZWZpbmVkID09PSBjbG9zZXN0IHx8IGNsb3Nlc3QgPT09IGZhbHNlKSB7XG4gICAgICBpZiAob3RoZXJzKSB7XG4gICAgICAgIGNsb3Nlc3QgPSB0aGlzLmlkQWJvdmUob3RoZXJzWzBdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xvc2VzdCA9IHRoaXMuaWRBYm92ZShpZClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3RcbiAgfSxcblxuICBuZXh0U2libGluZzogZnVuY3Rpb24gKGlkLCBzdHJpY3QpIHtcbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgIGlmICh1bmRlZmluZWQgPT09IHBpZCkgcmV0dXJuICFzdHJpY3QgJiYgdGhpcy5pZHNbaWRdLmNoaWxkcmVuWzBdXG4gICAgdmFyIGl4ID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA8IHRoaXMuaWRzW3BpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMSkgcmV0dXJuIHRoaXMuaWRzW3BpZF0uY2hpbGRyZW5baXggKyAxXVxuICAgIGlmICh0aGlzLmlkc1tpZF0uY29sbGFwc2VkKSB7XG4gICAgICByZXR1cm4gIXN0cmljdCAmJiB0aGlzLm5leHRTaWJsaW5nKHBpZCwgc3RyaWN0KVxuICAgIH1cbiAgICByZXR1cm4gIXN0cmljdCAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW5bMF1cbiAgfSxcblxuICBsYXN0U2libGluZzogZnVuY3Rpb24gKGlkLCBzdHJpY3QpIHtcbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgIGlmICh1bmRlZmluZWQgPT09IHBpZCkgcmV0dXJuICFzdHJpY3QgJiYgdGhpcy5pZHNbaWRdLmNoaWxkcmVuWzBdXG4gICAgdmFyIGl4ID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA9PT0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5sZW5ndGggLSAxKSByZXR1cm4gIXN0cmljdCAmJiB0aGlzLmlkc1tpZF0uY2hpbGRyZW5bMF1cbiAgICByZXR1cm4gdGhpcy5pZHNbcGlkXS5jaGlsZHJlblt0aGlzLmlkc1twaWRdLmNoaWxkcmVuLmxlbmd0aCAtIDFdXG4gIH0sXG5cbiAgZmlyc3RTaWJsaW5nOiBmdW5jdGlvbiAoaWQsIHN0cmljdCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gcGlkKSByZXR1cm4gLy8gdGhpcy5pZHNbaWRdLmNoaWxkcmVuWzBdXG4gICAgdmFyIGl4ID0gdGhpcy5pZHNbcGlkXS5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA9PT0gMCkgcmV0dXJuICFzdHJpY3QgJiYgcGlkXG4gICAgcmV0dXJuIHRoaXMuaWRzW3BpZF0uY2hpbGRyZW5bMF1cbiAgfSxcblxuICBsYXN0T3BlbjogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmlkc1tpZF1cbiAgICB3aGlsZSAobm9kZS5jaGlsZHJlbi5sZW5ndGggJiYgKG5vZGUuaWQgPT09IGlkIHx8ICFub2RlLmNvbGxhcHNlZCkpIHtcbiAgICAgIG5vZGUgPSB0aGlzLmlkc1tub2RlLmNoaWxkcmVuW25vZGUuY2hpbGRyZW4ubGVuZ3RoIC0gMV1dXG4gICAgfVxuICAgIHJldHVybiBub2RlLmlkXG4gIH0sXG5cbiAgaWRBYm92ZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHBpZCA9IHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgICAgICwgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgIGlmICghcGFyZW50KSByZXR1cm5cbiAgICB2YXIgaXggPSBwYXJlbnQuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICBpZiAoaXggPT09IDApIHtcbiAgICAgIHJldHVybiBwaWRcbiAgICB9XG4gICAgdmFyIHByZXZpZCA9IHBhcmVudC5jaGlsZHJlbltpeCAtIDFdXG4gICAgd2hpbGUgKHRoaXMuaWRzW3ByZXZpZF0uY2hpbGRyZW4gJiZcbiAgICAgICAgICAgdGhpcy5pZHNbcHJldmlkXS5jaGlsZHJlbi5sZW5ndGggJiZcbiAgICAgICAgICAgIXRoaXMuaWRzW3ByZXZpZF0uY29sbGFwc2VkKSB7XG4gICAgICBwcmV2aWQgPSB0aGlzLmlkc1twcmV2aWRdLmNoaWxkcmVuW3RoaXMuaWRzW3ByZXZpZF0uY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICB9XG4gICAgcmV0dXJuIHByZXZpZFxuICB9LFxuXG4gIC8vIGdldCB0aGUgcGxhY2UgdG8gc2hpZnQgbGVmdCB0b1xuICBzaGlmdExlZnRQbGFjZTogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHBpZCA9IHRoaXMuaWRzW2lkXS5wYXJlbnRcbiAgICAgICwgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgIGlmICghcGFyZW50KSByZXR1cm5cbiAgICB2YXIgcHBpZCA9IHBhcmVudC5wYXJlbnRcbiAgICAgICwgcHBhcmVudCA9IHRoaXMuaWRzW3BwaWRdXG4gICAgaWYgKCFwcGFyZW50KSByZXR1cm5cbiAgICB2YXIgcGl4ID0gcHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKHBpZClcbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwcGlkLFxuICAgICAgaXg6IHBpeCArIDFcbiAgICB9XG4gIH0sXG5cbiAgc2hpZnRVcFBsYWNlOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgICAgLCBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgIHZhciBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA9PT0gMCkge1xuICAgICAgdmFyIHBsID0gdGhpcy5zaGlmdExlZnRQbGFjZShpZClcbiAgICAgIGlmICghcGwpIHJldHVyblxuICAgICAgcGwuaXggLT0gMVxuICAgICAgcmV0dXJuIHBsXG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGl4OiBpeCAtIDFcbiAgICB9XG4gIH0sXG5cbiAgc2hpZnREb3duUGxhY2U6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudCA9IHRoaXMuaWRzW3BpZF1cbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuXG4gICAgdmFyIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKGl4ID49IHBhcmVudC5jaGlsZHJlbi5sZW5ndGggLSAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaGlmdExlZnRQbGFjZShpZClcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHBpZDogcGlkLFxuICAgICAgaXg6IGl4ICsgMVxuICAgIH1cbiAgfSxcblxuICBtb3ZlQmVmb3JlUGxhY2U6IGZ1bmN0aW9uIChpZCwgdGlkKSB7XG4gICAgdmFyIHNpYiA9IHRoaXMuaWRzW2lkXVxuICAgICAgLCBwaWQgPSBzaWIucGFyZW50XG4gICAgICAsIG9waWQgPSB0aGlzLmlkc1t0aWRdLnBhcmVudFxuICAgIGlmICh1bmRlZmluZWQgPT09IHBpZCkgcmV0dXJuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuaWRzW3BpZF1cbiAgICB2YXIgbml4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgaWYgKHBpZCA9PT0gb3BpZCAmJiBwYXJlbnQuY2hpbGRyZW4uaW5kZXhPZih0aWQpIDwgbml4KSB7XG4gICAgICBuaXggLT0gMVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwaWQsXG4gICAgICBpeDogbml4XG4gICAgfVxuICB9LFxuXG4gIG1vdmVBZnRlclBsYWNlOiBmdW5jdGlvbiAoaWQsIG9pZCkge1xuICAgIHZhciBzaWIgPSB0aGlzLmlkc1tpZF1cbiAgICAgICwgcGlkID0gc2liLnBhcmVudFxuICAgICAgLCBvcGlkID0gdGhpcy5pZHNbb2lkXS5wYXJlbnRcbiAgICBpZiAodW5kZWZpbmVkID09PSBwaWQpIHJldHVyblxuICAgIHZhciBvaXggPSB0aGlzLmlkc1tvcGlkXS5jaGlsZHJlbi5pbmRleE9mKG9pZClcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgICAgLCBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKSArIDFcbiAgICBpZiAoIHBpZCA9PT0gb3BpZCAmJiBpeCA+IG9peCkgaXggLT0gMVxuICAgIHJldHVybiB7XG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGl4OiBpeFxuICAgIH1cbiAgfSxcblxuICBpZEJlbG93OiBmdW5jdGlvbiAoaWQsIHJvb3QpIHtcbiAgICBpZiAodGhpcy5pZHNbaWRdLmNoaWxkcmVuICYmXG4gICAgICAgIHRoaXMuaWRzW2lkXS5jaGlsZHJlbi5sZW5ndGggJiZcbiAgICAgICAgKGlkID09PSByb290IHx8ICF0aGlzLmlkc1tpZF0uY29sbGFwc2VkKSkge1xuICAgICAgcmV0dXJuIHRoaXMuaWRzW2lkXS5jaGlsZHJlblswXVxuICAgIH1cbiAgICB2YXIgcGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICAgICAgLCBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgIHZhciBpeCA9IHBhcmVudC5jaGlsZHJlbi5pbmRleE9mKGlkKVxuICAgIHdoaWxlIChpeCA9PT0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCAtIDEpIHtcbiAgICAgIGlmIChwYXJlbnQuaWQgPT09IHJvb3QpIHJldHVyblxuICAgICAgcGFyZW50ID0gdGhpcy5pZHNbcGFyZW50LnBhcmVudF1cbiAgICAgIGlmICghcGFyZW50KSByZXR1cm5cbiAgICAgIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YocGlkKVxuICAgICAgcGlkID0gcGFyZW50LmlkXG4gICAgfVxuICAgIHJldHVybiBwYXJlbnQuY2hpbGRyZW5baXggKyAxXVxuICB9LFxuXG4gIGlkTmV3OiBmdW5jdGlvbiAoaWQsIGJlZm9yZSwgcm9vdCkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudFxuICAgICAgLCBuaXhcbiAgICBpZiAoYmVmb3JlKSB7XG4gICAgICBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgICBuaXggPSBwYXJlbnQuY2hpbGRyZW4uaW5kZXhPZihpZClcbiAgICB9IGVsc2UgaWYgKGlkID09PSB0aGlzLnJvb3QgfHxcbiAgICAgICAgcm9vdCA9PT0gaWQgfHxcbiAgICAgICAgKHRoaXMuaWRzW2lkXS5jaGlsZHJlbiAmJlxuICAgICAgICB0aGlzLmlkc1tpZF0uY2hpbGRyZW4ubGVuZ3RoICYmXG4gICAgICAgICF0aGlzLmlkc1tpZF0uY29sbGFwc2VkKSkge1xuICAgICAgcGlkID0gaWRcbiAgICAgIG5peCA9IDBcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50ID0gdGhpcy5pZHNbcGlkXVxuICAgICAgbml4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpICsgMVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcGlkOiBwaWQsXG4gICAgICBpbmRleDogbml4XG4gICAgfVxuICB9LFxuXG4gIHNhbWVQbGFjZTogZnVuY3Rpb24gKGlkLCBwbGFjZSkge1xuICAgIHZhciBwaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgaWYgKCFwaWQgfHwgcGlkICE9PSBwbGFjZS5waWQpIHJldHVybiBmYWxzZVxuICAgIHZhciBwYXJlbnQgPSB0aGlzLmlkc1twaWRdXG4gICAgICAsIGl4ID0gcGFyZW50LmNoaWxkcmVuLmluZGV4T2YoaWQpXG4gICAgcmV0dXJuIGl4ID09PSBwbGFjZS5peFxuICB9LFxuXG4gIGZpbmRDb2xsYXBzZXI6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICgoIXRoaXMuaWRzW2lkXS5jaGlsZHJlbiB8fFxuICAgICAgICAgIXRoaXMuaWRzW2lkXS5jaGlsZHJlbi5sZW5ndGggfHxcbiAgICAgICAgIHRoaXMuaWRzW2lkXS5jb2xsYXBzZWQpICYmXG4gICAgICAgIHRoaXMuaWRzW2lkXS5wYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWQgPSB0aGlzLmlkc1tpZF0ucGFyZW50XG4gICAgfVxuICAgIHJldHVybiBpZFxuICB9LFxufVxuXG4iLCIvKlxuICogdHJ1ZSA9PiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gbm90IGRlYWxpbmcgd2l0aCB0aGUgYWN0aXZlIGVsZW1lbnRcbiAgJ3VuZG8nOiB7XG4gICAgaGVscDogJ1VuZG8gdGhlIGxhc3QgYWN0aW9uJyxcbiAgfSxcblxuICAncmVkbyc6IHtcbiAgICBoZWxwOiAnVW5kbyB0aGUgbGFzdCBhY3Rpb24nLFxuICB9LFxuXG4gICdjdXQnOiB7XG4gICAgaGVscDogJ3JlbW92ZSB0aGUgY3Vycm5ldGx5IHNlbGVjdGVkIGl0ZW0gYW5kIHBsYWNlIGl0IGluIHRoZSBjbGlwYm9hcmQnLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgfSxcblxuICAnY29weSc6IHtcbiAgICBoZWxwOiAncGxhY2UgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIGluIHRoZSBjbGlwYm9hcmQnLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgfSxcblxuICAncGFzdGUnOiB7XG4gICAgaGVscDogJ2luc2VydCB0aGUgY29udGVudHMgb2YgdGhlIGNsaXBib2FyZCwgaW50byBvciBiZWxvdyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0nLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgfSxcblxuICAncGFzdGUgYWJvdmUnOiB7XG4gICAgaGVscDogJ2luc2VydCB0aGUgY29udGVudHMgb2YgdGhlIGNsaXBib2FyZCBhYm92ZSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0nLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgfSxcblxuICAndmlzdWFsIG1vZGUnOiB7XG4gICAgaGVscDogJ2VudGVyIG11bHRpLXNlbGVjdCBtb2RlJyxcbiAgICBhY3RpdmU6ICchcm9vdCcsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnNldFNlbGVjdGlvbihbdGhpcy5hY3RpdmVdKVxuICAgIH0sXG4gIH0sXG5cbiAgJ2NoYW5nZSc6IHtcbiAgICBoZWxwOiAnY2xlYXIgdGhlIGNvbnRlbnRzIG9mIHRoaXMgbm9kZSBhbmQgc3RhcnQgZWRpdGluZycsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy52bC5ib2R5KHRoaXMuYWN0aXZlKS5zZXRDb250ZW50KCcnKVxuICAgICAgdGhpcy52bC5ib2R5KHRoaXMuYWN0aXZlKS5zdGFydEVkaXRpbmcoKVxuICAgIH0sXG4gIH0sXG5cbiAgZWRpdDoge1xuICAgIGhlbHA6ICdzdGFydCBlZGl0aW5nIHRoaXMgbm9kZSBhdCB0aGUgZW5kJyxcbiAgICBhY3RpdmU6IHRydWUsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnZsLmJvZHkodGhpcy5hY3RpdmUpLnN0YXJ0RWRpdGluZygpXG4gICAgfVxuICB9LFxuXG4gICdlZGl0IHN0YXJ0Jzoge1xuICAgIGhlbHA6ICdzdGFydCBlZGl0aW5nIHRoaXMgbm9kZSBhdCB0aGUgc3RhcnQnLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudmwuYm9keSh0aGlzLmFjdGl2ZSkuc3RhcnRFZGl0aW5nKHRydWUpXG4gICAgfSxcbiAgfSxcblxuICAvLyBuYXZcbiAgJ2ZpcnN0IHNpYmxpbmcnOiB7XG4gICAgaGVscDogJ2p1bXAgdG8gdGhlIGZpcnN0IHNpYmxpbmcnLFxuICAgIGFjdGl2ZTogJyFuZXcnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGZpcnN0ID0gdGhpcy5tb2RlbC5maXJzdFNpYmxpbmcodGhpcy5hY3RpdmUpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBmaXJzdCkgcmV0dXJuXG4gICAgICB0aGlzLnNldEFjdGl2ZShmaXJzdClcbiAgICB9XG4gIH0sXG5cbiAgJ2xhc3Qgc2libGluZyc6IHtcbiAgICBoZWxwOiAnanVtcCB0byB0aGUgbGFzdCBzaWJsaW5nJyxcbiAgICBhY3RpdmU6ICchbmV3JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBsYXN0ID0gdGhpcy5tb2RlbC5sYXN0U2libGluZyh0aGlzLmFjdGl2ZSlcbiAgICAgIGlmICh1bmRlZmluZWQgPT09IGxhc3QpIHJldHVyblxuICAgICAgdGhpcy5zZXRBY3RpdmUobGFzdClcbiAgICB9LFxuICB9LFxuXG4gICdqdW1wIHRvIHRvcCc6IHtcbiAgICBoZWxwOiAnanVtcCB0byB0aGUgdG9wJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICB9LFxuICB9LFxuXG4gICdqdW1wIHRvIGJvdHRvbSc6IHtcbiAgICBoZWxwOiAnanVtcCB0byB0aGUgbGFzdCBub2RlJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc2V0QWN0aXZlKHRoaXMubW9kZWwubGFzdE9wZW4odGhpcy5yb290KSlcbiAgICAgIGNvbnNvbGUubG9nKCdib3R0b20nKVxuICAgICAgLy8gcGFzc1xuICAgIH0sXG4gIH0sXG5cbiAgJ3VwJzoge1xuICAgIGhlbHA6ICdnbyB0byB0aGUgcHJldmlvdXMgbm9kZScsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFib3ZlXG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09ICduZXcnKSB7XG4gICAgICAgIGFib3ZlID0gdGhpcy5yb290XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdG9wID0gdGhpcy5hY3RpdmVcbiAgICAgICAgYWJvdmUgPSB0aGlzLm1vZGVsLmlkQWJvdmUodG9wKVxuICAgICAgICBpZiAoYWJvdmUgPT09IHVuZGVmaW5lZCkgYWJvdmUgPSB0b3BcbiAgICAgIH1cbiAgICAgIGlmIChhYm92ZSA9PT0gdGhpcy5yb290ICYmIHRoaXMuby5ub1NlbGVjdFJvb3QpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnNldEFjdGl2ZShhYm92ZSlcbiAgICB9LFxuICB9LFxuXG4gICdkb3duJzoge1xuICAgIGhlbHA6ICdnbyBkb3duIHRvIHRoZSBuZXh0IG5vZGUnLFxuICAgIGFjdGl2ZTogJyFuZXcnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB0aGlzLnJvb3QgJiZcbiAgICAgICAgICAhdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKCduZXcnKVxuICAgICAgfVxuICAgICAgdmFyIHRvcCA9IHRoaXMuYWN0aXZlXG4gICAgICAgICwgYWJvdmUgPSB0aGlzLm1vZGVsLmlkQmVsb3codG9wLCB0aGlzLnJvb3QpXG4gICAgICBpZiAoYWJvdmUgPT09IHVuZGVmaW5lZCkgYWJvdmUgPSB0b3BcbiAgICAgIHRoaXMuc2V0QWN0aXZlKGFib3ZlKVxuICAgIH1cbiAgfSxcblxuICAnbGVmdCc6IHtcbiAgICBoZWxwOiAnZ28gdXAgYSBsZXZlbCB0byB0aGUgcGFyZW50JyxcbiAgICBhY3RpdmU6IHRydWUsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gJ25ldycpIHJldHVybiB0aGlzLnNldEFjdGl2ZSh0aGlzLnJvb3QpXG4gICAgICB2YXIgbGVmdCA9IHRoaXMubW9kZWwuZ2V0UGFyZW50KHRoaXMuYWN0aXZlKVxuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gbGVmdCkgcmV0dXJuXG4gICAgICB0aGlzLnNldEFjdGl2ZShsZWZ0KVxuICAgIH0sXG4gIH0sXG5cbiAgJ3JpZ2h0Jzoge1xuICAgIGhlbHA6ICdnbyBkb3duIGEgbGV2ZWwgdG8gdGhlIGZpcnN0IGNoaWxkJyxcbiAgICBhY3RpdmU6ICchbm93JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gdGhpcy5yb290ICYmXG4gICAgICAgICAgIXRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldEFjdGl2ZSgnbmV3JylcbiAgICAgIH1cbiAgICAgIHZhciByaWdodCA9IHRoaXMubW9kZWwuZ2V0Q2hpbGQodGhpcy5hY3RpdmUpXG4gICAgICBpZiAodGhpcy5tb2RlbC5pc0NvbGxhcHNlZCh0aGlzLmFjdGl2ZSkpIHJldHVyblxuICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcmlnaHQpIHJldHVyblxuICAgICAgdGhpcy5zZXRBY3RpdmUocmlnaHQpXG4gICAgfSxcbiAgfSxcblxuICAnbmV4dCBzaWJsaW5nJzoge1xuICAgIGhlbHA6ICdqdW1wIHRvIHRoZSBuZXh0IHNpYmxpbmcgKHNraXBwaW5nIGNoaWxkcmVuKScsXG4gICAgYWN0aXZlOiAnIW5ldycsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2liID0gdGhpcy5tb2RlbC5uZXh0U2libGluZyh0aGlzLmFjdGl2ZSlcbiAgICAgIGlmICh1bmRlZmluZWQgPT09IHNpYikgcmV0dXJuXG4gICAgICB0aGlzLnNldEFjdGl2ZShzaWIpXG4gICAgfSxcbiAgfSxcblxuICAncHJldiBzaWJsaW5nJzoge1xuICAgIGhlbHA6ICdqdW1wIHRvIHRoZSBwcmV2aW91cyBzaWJsaW5nIChza2lwcGluZyBjaGlsZHJlbiknLFxuICAgIGFjdGl2ZTogJyFuZXcnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNpYiA9IHRoaXMubW9kZWwucHJldlNpYmxpbmcodGhpcy5hY3RpdmUpXG4gICAgICBpZiAodW5kZWZpbmVkID09PSBzaWIpIHJldHVyblxuICAgICAgdGhpcy5zZXRBY3RpdmUoc2liKVxuICAgIH0sXG4gIH0sXG5cbiAgJ21vdmUgdG8gZmlyc3Qgc2libGluZyc6IHtcbiAgICBoZWxwOiAnbW92ZSB0aGlzIG5vZGUgdG8gYmUgdGhlIGZpcnN0IGNoaWxkIGlmIGl0cyBwYXJlbnQnLFxuICAgIGFjdGl2ZTogJyFuZXcnLFxuICAgIGFjdGlvbjogJ21vdmVUb1RvcCdcbiAgfSxcblxuICAnbW92ZSB0byBsYXN0IHNpYmxpbmcnOiB7XG4gICAgaGVscDogJ21vdmUgdGhpcyB0byBiZSB0aGUgbGFzdCBjaGlsZCBvZiBpdHMgcGFyZW50JyxcbiAgICBhY3RpdmU6ICchbmV3JyxcbiAgICBhY3Rpb246ICdtb3ZlVG9Cb3R0b20nXG4gIH0sXG5cbiAgJ25ldyBiZWZvcmUnOiB7XG4gICAgaGVscDogJ2NyZWF0ZSBhIG5vZGUgYWJvdmUgdGhpcyBvbmUgYW5kIHN0YXJ0IGVkaXRpbmcnLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY3RybGFjdGlvbnMuYWRkQmVmb3JlKHRoaXMuYWN0aXZlLCAnJywgdHJ1ZSlcbiAgICB9XG4gIH0sXG5cbiAgJ25ldyBhZnRlcic6IHtcbiAgICBoZWxwOiAnY3JlYXRlIGEgbm9kZSBhZnRlciB0aGlzIG9uZSBhbmQgc3RhcnQgZWRpdGluZycsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSAnbmV3JykgcmV0dXJuIHRoaXMuc3RhcnRFZGl0aW5nKClcbiAgICAgIHRoaXMuY3RybGFjdGlvbnMuYWRkQWZ0ZXIodGhpcy5hY3RpdmUsICcnLCB0cnVlKVxuICAgIH0sXG4gIH0sXG5cbiAgLy8gbW92ZXohXG4gICd0b2dnbGUgY29sbGFwc2UnOiB7XG4gICAgaGVscDogJ3RvZ2dsZSBjb2xsYXBzZScsXG4gICAgYWN0aXZlOiB0cnVlLFxuICB9LFxuXG4gICdjb2xsYXBzZSc6IHtcbiAgICBoZWxwOiAnY29sbGFwc2UgdGhlIG5vZGUnLFxuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuY3RybGFjdGlvbnMudG9nZ2xlQ29sbGFwc2UodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgfSxcbiAgfSxcblxuICAndW5jb2xsYXBzZSc6IHtcbiAgICBoZWxwOiAnZXhwYW5kIHRoZSBub2RlJyxcbiAgICBhY3RpdmU6IHRydWUsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmN0cmxhY3Rpb25zLnRvZ2dsZUNvbGxhcHNlKHRoaXMuYWN0aXZlLCBmYWxzZSlcbiAgICB9XG4gIH0sXG5cbiAgJ2luZGVudCc6IHtcbiAgICBoZWxwOiAnaW5kZW50IHRoZSBub2RlJyxcbiAgICBhY3RpdmU6IHRydWUsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmN0cmxhY3Rpb25zLm1vdmVSaWdodCh0aGlzLmFjdGl2ZSlcbiAgICB9LFxuICB9LFxuXG4gICdkZWRlbnQnOiB7XG4gICAgaGVscDogJ2RlZGVudCB0aGUgbm9kZScsXG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5jdHJsYWN0aW9ucy5tb3ZlTGVmdCh0aGlzLmFjdGl2ZSlcbiAgICB9LFxuICB9LFxuXG4gICdtb3ZlIGRvd24nOiB7XG4gICAgaGVscDogJ21vdmUgdGhlIGN1cnJlbnQgbm9kZSBkb3duJyxcbiAgICBhY3RpdmU6IHRydWVcbiAgfSxcblxuICAnbW92ZSB1cCc6IHtcbiAgICBoZWxwOiAnbW92ZSB0aGUgY3VycmVudCBub2RlIHVwJyxcbiAgICBhY3RpdmU6IHRydWUsXG4gIH0sXG59XG5cbiIsIlxuZnVuY3Rpb24gbWVyZ2UoYSkge1xuICBmb3IgKHZhciBpPTE7IGk8YXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yICh2YXIgbmFtZSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGFbbmFtZV0gPSBhcmd1bWVudHNbaV1bbmFtZV1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlXG5cbmZ1bmN0aW9uIG5vb3AoKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCFcIilcbn1cblxuZnVuY3Rpb24gQmFzZSgpIHtcbiAgdGhpcy5fbGlzdGVuZXJzID0ge31cbn1cblxuQmFzZS5leHRlbmQgPSBmdW5jdGlvbiAoZm4sIG9iaikge1xuICBmbi5wcm90b3R5cGUgPSBtZXJnZShPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKSwgb2JqKVxuICBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBmblxufVxuXG5CYXNlLnByb3RvdHlwZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24gKGRvbmUpIHtcbiAgICBkb25lKClcbiAgfSxcblxuICBsaXN0ZW46IGZ1bmN0aW9uICh0eXBlLCBhZGQsIGNoYW5nZSkge1xuICAgIC8vIG5vb3BcbiAgfSxcblxuICBzYXZlOiBub29wLFxuICB1cGRhdGU6IG5vb3AsXG4gIGZpbmRBbGw6IG5vb3AsXG4gIHJlbW92ZTogbm9vcCxcbiAgbG9hZDogbm9vcCxcbiAgZHVtcDogbm9vcCxcblxuICByZW1vdmVCYXRjaDogZnVuY3Rpb24gKHR5cGUsIGlkcykge1xuICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucmVtb3ZlKHR5cGUsIGlkc1tpXSlcbiAgICB9XG4gIH0sXG5cbiAgLy8gZXZlbnQgZW1pdHRlciBzdHVmZlxuICBlbWl0OiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICBpZiAoIXRoaXMuX2xpc3RlbmVyc1tldnRdKSByZXR1cm4gZmFsc2VcbiAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5fbGlzdGVuZXJzW2V2dF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2xpc3RlbmVyc1tldnRdW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgfVxuICB9LFxuXG4gIG9uOiBmdW5jdGlvbiAoZXZ0LCBoYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLl9saXN0ZW5lcnNbZXZ0XSkge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2dF0gPSBbXVxuICAgIH1cbiAgICB0aGlzLl9saXN0ZW5lcnNbZXZ0XS5wdXNoKGhhbmRsZXIpXG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbiAoZXZ0LCBoYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLl9saXN0ZW5lcnNbZXZ0XSkgcmV0dXJuIGZhbHNlXG4gICAgdmFyIGkgPSB0aGlzLl9saXN0ZW5lcnNbZXZ0XS5pbmRleE9mKGhhbmRsZXIpXG4gICAgaWYgKGkgPT09IC0xKSByZXR1cm4gZmFsc2VcbiAgICB0aGlzLl9saXN0ZW5lcnNbZXZ0XS5zcGxpY2UoaSwgMSlcbiAgfSxcbn1cblxuIiwiXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG52YXIgdXVpZCA9IHJlcXVpcmUoJy4uL3V1aWQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpcmVQTFxuXG52YXIgQ09MT1JTID0gJyM0MmI5YmQgI2E0MDVmYSAjN2U2YzkzICNmZWU5MDEgI2E4ZmY5OScuc3BsaXQoJyAnKVxuZnVuY3Rpb24gcmFuZENvbG9yKCkge1xuICByZXR1cm4gQ09MT1JTW3BhcnNlSW50KE1hdGgucmFuZG9tKCkgKiBDT0xPUlMubGVuZ3RoKV1cbn1cblxuZnVuY3Rpb24gRmlyZVBMKG9wdGlvbnMpIHtcbiAgQmFzZS5jYWxsKHRoaXMpXG4gIHRoaXMuZGIgPSBuZXcgRmlyZWJhc2Uob3B0aW9ucy51cmwpO1xuICB0aGlzLmRhdGEgPSB7fVxufVxuXG5CYXNlLmV4dGVuZChGaXJlUEwsIHtcbiAgaW5pdDogZnVuY3Rpb24gKGRvbmUpIHtcbiAgICB2YXIgaWQgPSB1dWlkKCk7XG4gICAgdGhpcy5fdXNlcmlkID0gaWRcbiAgICB0aGlzLmRiLm9uY2UoJ3ZhbHVlJywgZnVuY3Rpb24gKHNuYXBzaG90KSB7XG4gICAgICB0aGlzLmRhdGEgPSBzbmFwc2hvdC52YWwoKVxuICAgICAgdmFyIHVzZXIgPSB0aGlzLmRiLmNoaWxkKCd1c2VycycpLmNoaWxkKGlkKVxuICAgICAgdXNlci5zZXQoe3NlbGVjdGlvbjogZmFsc2UsIGNvbG9yOiByYW5kQ29sb3IoKX0pXG4gICAgICB1c2VyLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpXG4gICAgICBkb25lKCk7XG4gICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgdmFyIHVzZXJzID0gdGhpcy5kYi5jaGlsZCgndXNlcnMnKVxuICAgIHVzZXJzLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgdmFyIGlkID0gc25hcHNob3QubmFtZSgpXG4gICAgICB2YXIgdXNlciA9IHNuYXBzaG90LnZhbCgpXG4gICAgICBpZiAoaWQgPT09IHRoaXMuX3VzZXJpZCkgdXNlci5zZWxmID0gdHJ1ZVxuICAgICAgdGhpcy5lbWl0KCdhZGRBY3RpdmUnLCBpZCwgdXNlcilcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICB1c2Vycy5vbignY2hpbGRfY2hhbmdlZCcsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgdmFyIGlkID0gc25hcHNob3QubmFtZSgpXG4gICAgICB2YXIgdXNlciA9IHNuYXBzaG90LnZhbCgpXG4gICAgICBpZiAoaWQgPT09IHRoaXMuX3VzZXJpZCkgdXNlci5zZWxmID0gdHJ1ZVxuICAgICAgdGhpcy5lbWl0KCdjaGFuZ2VBY3RpdmUnLCBpZCwgdXNlcilcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICB1c2Vycy5vbignY2hpbGRfcmVtb3ZlZCcsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgdmFyIGlkID0gc25hcHNob3QubmFtZSgpXG4gICAgICB2YXIgdXNlciA9IHNuYXBzaG90LnZhbCgpXG4gICAgICBpZiAoaWQgPT09IHRoaXMuX3VzZXJpZCkgdXNlci5zZWxmID0gdHJ1ZVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVBY3RpdmUnLCBpZCwgdXNlcilcbiAgICB9LmJpbmQodGhpcykpXG4gIH0sXG5cbiAgc2V0UHJlc2VuY2U6IGZ1bmN0aW9uIChzZWxlY3Rpb24pIHtcbiAgICB0aGlzLmRiLmNoaWxkKCd1c2VycycpLmNoaWxkKHRoaXMuX3VzZXJpZCkudXBkYXRlKHtcbiAgICAgIC8vIHRvZG8gdXNlcm5hbWVzXG4gICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblxuICAgIH0pXG4gIH0sXG5cbiAgbGlzdGVuOiBmdW5jdGlvbiAodHlwZSwgb25BZGQsIG9uQ2hhbmdlZCkge1xuICAgIHRoaXMuZGIuY2hpbGQodHlwZSkub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgIHZhciBpZCA9IHNuYXBzaG90Lm5hbWUoKVxuICAgICAgdmFyIGRhdGEgPSBzbmFwc2hvdC52YWwoKVxuICAgICAgdGhpcy5kYXRhW3R5cGVdW2lkXSA9IGRhdGFcbiAgICAgICBvbkNoYW5nZWQoaWQsIGRhdGEpXG4gICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5kYi5jaGlsZCh0eXBlKS5vbignY2hpbGRfYWRkZWQnLCBmdW5jdGlvbiAoc25hcHNob3QpIHtcbiAgICAgIHZhciBpZCA9IHNuYXBzaG90Lm5hbWUoKVxuICAgICAgdmFyIGRhdGEgPSBzbmFwc2hvdC52YWwoKVxuICAgICAgdGhpcy5kYXRhW3R5cGVdW2lkXSA9IGRhdGFcbiAgICAgIG9uQWRkKGlkLCBkYXRhKVxuICAgIH0uYmluZCh0aGlzKSlcbiAgfSxcblxuICBzYXZlOiBmdW5jdGlvbiAodHlwZSwgaWQsIGRhdGEsIGRvbmUpIHtcbiAgICB0aGlzLmRhdGFbdHlwZV1baWRdID0gZGF0YVxuICAgIHRoaXMuZGIuY2hpbGQodHlwZSkuY2hpbGQoaWQpLnNldChkYXRhLCBkb25lKVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKHR5cGUsIGlkLCB1cGRhdGUsIGRvbmUpIHtcbiAgICB0aGlzLmRiLmNoaWxkKHR5cGUpLmNoaWxkKGlkKS51cGRhdGUodXBkYXRlLCBkb25lKVxuICB9LFxuXG4gIGZpbmRBbGw6IGZ1bmN0aW9uICh0eXBlLCBkb25lKSB7XG4gICAgdGhpcy5kYi5jaGlsZCh0eXBlKS5vbmNlKCd2YWx1ZScsIGZ1bmN0aW9uIChzbmFwc2hvdCkge1xuICAgICAgdmFyIGl0ZW1zID0gW11cbiAgICAgIHZhciB2YWwgPSBzbmFwc2hvdC52YWwoKVxuICAgICAgZm9yICh2YXIgbmFtZSBpbiB2YWwpIHtcbiAgICAgICAgaXRlbXMucHVzaCh2YWxbbmFtZV0pXG4gICAgICB9XG4gICAgICBkb25lKG51bGwsIGl0ZW1zKVxuICAgIH0pXG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAodHlwZSwgaWQsIGRvbmUpIHtcbiAgICB0aGlzLmRiLmNoaWxkKHR5cGUpLmNoaWxkKGlkKS5yZW1vdmUoZG9uZSlcbiAgfSxcblxuICBsb2FkOiBmdW5jdGlvbiAoZGF0YSwgZG9uZSwgY2xlYXIpIHtcbiAgfSxcblxuICBkdW1wOiBmdW5jdGlvbiAoZG9uZSkge1xuICB9LFxufSlcblxuIiwiXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpXG5cbm1vZHVsZS5leHBvcnRzID0gTWVtUExcblxuZnVuY3Rpb24gTWVtUEwoKSB7XG4gIHRoaXMuZGF0YSA9IHt9XG59XG5cbkJhc2UuZXh0ZW5kKE1lbVBMLCB7XG4gIGluaXQ6IGZ1bmN0aW9uIChkb25lKSB7XG4gICAgZG9uZSgpXG4gIH0sXG5cbiAgc2F2ZTogZnVuY3Rpb24gKHR5cGUsIGlkLCBkYXRhLCBkb25lKSB7XG4gICAgaWYgKCF0aGlzLmRhdGFbdHlwZV0pIHtcbiAgICAgIHRoaXMuZGF0YVt0eXBlXSA9IHt9XG4gICAgfVxuICAgIHRoaXMuZGF0YVt0eXBlXVtpZF0gPSBkYXRhXG4gICAgZG9uZSAmJiBkb25lKClcbiAgfSxcblxuICB1cGRhdGU6IGZ1bmN0aW9uICh0eXBlLCBpZCwgdXBkYXRlLCBkb25lKSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiB1cGRhdGUpIHtcbiAgICAgIHRoaXMuZGF0YVt0eXBlXVtpZF1bYXR0cl0gPSB1cGRhdGVbYXR0cl1cbiAgICB9XG4gICAgZG9uZSAmJiBkb25lKClcbiAgfSxcblxuICBmaW5kQWxsOiBmdW5jdGlvbiAodHlwZSwgZG9uZSkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgaWYgKHRoaXMuZGF0YVt0eXBlXSkge1xuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5kYXRhW3R5cGVdKSB7XG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy5kYXRhW3R5cGVdW2lkXSlcbiAgICAgIH1cbiAgICB9XG4gICAgZG9uZShudWxsLCBpdGVtcylcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uICh0eXBlLCBpZCwgZG9uZSkge1xuICAgIGRlbGV0ZSB0aGlzLmRhdGFbdHlwZV1baWRdXG4gICAgZG9uZSAmJiBkb25lKClcbiAgfSxcblxuICBsb2FkOiBmdW5jdGlvbiAoZGF0YSwgZG9uZSwgY2xlYXIpIHtcbiAgICBkb25lICYmIGRvbmUoKTtcbiAgfSxcblxuICBkdW1wOiBmdW5jdGlvbiAoZG9uZSkge1xuICAgIGRvbmUobnVsbCwge25vZGVzOiB7fX0pO1xuICB9XG59KVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2xpZGVEb3duKG5vZGUpIHtcbiAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSlcbiAgICAsIGhlaWdodCA9IHN0eWxlLmhlaWdodFxuICBpZiAoIXBhcnNlSW50KGhlaWdodCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgc3BlZWQgPSBwYXJzZUludChoZWlnaHQpIC8gNzAwXG4gIG5vZGUuc3R5bGUuaGVpZ2h0ID0gMFxuICBub2RlLnN0eWxlLnRyYW5zaXRpb24gPSAnaGVpZ2h0ICcgKyBzcGVlZCArICdzIGVhc2UnXG4gIG5vZGUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJ1xuICBjb25zb2xlLmxvZyhoZWlnaHQpXG5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ3knLCBoZWlnaHQpXG4gICAgbm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHRcbiAgfSwgMClcblxuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW4pXG4gIGZ1bmN0aW9uIGZpbigpIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW4pXG4gICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndHJhbnNpdGlvbicpXG4gICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnaGVpZ2h0JylcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvdmVyZmxvdycpXG4gIH1cbn1cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNsaWRlVXAobm9kZSwgZG9uZSkge1xuICAvKlxuICBhbmltYXRlKG5vZGUsIHtcbiAgICBoZWlnaHQ6IHtcbiAgICAgIGZyb206ICdjdXJyZW50JyxcbiAgICAgIHRvOiAwXG4gICAgfVxuICB9LCBkb25lKVxuICAqL1xuICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKVxuICAgICwgaGVpZ2h0ID0gc3R5bGUuaGVpZ2h0XG4gIGlmICghcGFyc2VJbnQoaGVpZ2h0KSkge1xuICAgIHJldHVyblxuICB9XG4gIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0XG4gIHZhciBzcGVlZCA9IHBhcnNlSW50KGhlaWdodCkgLyA3MDBcbiAgbm9kZS5zdHlsZS50cmFuc2l0aW9uID0gJ2hlaWdodCAnICsgc3BlZWQgKyAncyBlYXNlJ1xuICBub2RlLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbidcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBub2RlLnN0eWxlLmhlaWdodCA9IDBcbiAgfSwgMClcblxuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW4pXG4gIGZ1bmN0aW9uIGZpbigpIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW4pXG4gICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndHJhbnNpdGlvbicpXG4gICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnaGVpZ2h0JylcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvdmVyZmxvdycpXG4gICAgZG9uZSgpXG4gIH1cbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGV4dGVuZDogZXh0ZW5kLFxuICBtZXJnZTogbWVyZ2UsXG4gIGVuc3VyZUluVmlldzogZW5zdXJlSW5WaWV3LFxuICBtYWtlX2xpc3RlZDogbWFrZV9saXN0ZWQsXG4gIGlzTWFjOiBpc01hYyxcbn1cblxuZnVuY3Rpb24gaXNNYWMoKSB7XG4gIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLmluZGV4T2YoJ01hYycpID09PSAwXG59XG5cbmZ1bmN0aW9uIG1lcmdlKGEsIGIpIHtcbiAgdmFyIGMgPSB7fVxuICAgICwgZFxuICBmb3IgKGQgaW4gYSkge1xuICAgIGNbZF0gPSBhW2RdXG4gIH1cbiAgZm9yIChkIGluIGIpIHtcbiAgICBjW2RdID0gYltkXVxuICB9XG4gIHJldHVybiBjXG59XG5cbmZ1bmN0aW9uIGVuc3VyZUluVmlldyhpdGVtKSB7XG4gIHZhciBiYiA9IGl0ZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgaWYgKGJiLnRvcCA8IDApIHJldHVybiBpdGVtLnNjcm9sbEludG9WaWV3KClcbiAgaWYgKGJiLmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXcoZmFsc2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0ZW5kKGRlc3QpIHtcbiAgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24gKHNyYykge1xuICAgIGZvciAodmFyIGF0dHIgaW4gc3JjKSB7XG4gICAgICAgIGRlc3RbYXR0cl0gPSBzcmNbYXR0cl1cbiAgICB9XG4gIH0pXG4gIHJldHVybiBkZXN0XG59XG5cbmZ1bmN0aW9uIGxvYWQoZGIsIHRyZWUpIHtcbiAgdmFyIHJlcyA9IG1ha2VfbGlzdGVkKHRyZWUsIHVuZGVmaW5lZCwgdHJ1ZSlcbiAgZGIuc2F2ZSgncm9vdCcsIHtpZDogcmVzLmlkfSlcbiAgZm9yICh2YXIgaT0wOyBpPHJlcy50cmVlLmxlbmd0aDsgaSsrKSB7XG4gICAgZGIuc2F2ZSgnbm9kZScsIHJlcy50cmVlW2ldKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VfbGlzdGVkKGRhdGEsIG5leHRpZCwgY29sbGFwc2UpIHtcbiAgdmFyIGlkcyA9IHt9XG4gICAgLCBjaGlsZHJlbiA9IFtdXG4gICAgLCBuZGF0YSA9IHt9XG4gICAgLCByZXNcbiAgICAsIGlcbiAgaWYgKHVuZGVmaW5lZCA9PT0gbmV4dGlkKSBuZXh0aWQgPSAxMDBcblxuICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgIGZvciAoaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlcyA9IG1ha2VfbGlzdGVkKGRhdGEuY2hpbGRyZW5baV0sIG5leHRpZCwgY29sbGFwc2UpXG4gICAgICBmb3IgKHZhciBpZCBpbiByZXMudHJlZSkge1xuICAgICAgICBpZHNbaWRdID0gcmVzLnRyZWVbaWRdXG4gICAgICAgIGlkc1tpZF0uZGVwdGggKz0gMVxuICAgICAgfVxuICAgICAgY2hpbGRyZW4ucHVzaChyZXMuaWQpXG4gICAgICBuZXh0aWQgPSByZXMuaWQgKyAxXG4gICAgfVxuICAgIC8vIGRlbGV0ZSBkYXRhLmNoaWxkcmVuXG4gIH1cbiAgZm9yICh2YXIgYXR0ciBpbiBkYXRhKSB7XG4gICAgaWYgKGF0dHIgPT09ICdjaGlsZHJlbicpIGNvbnRpbnVlO1xuICAgIG5kYXRhW2F0dHJdID0gZGF0YVthdHRyXVxuICB9XG4gIG5kYXRhLmRvbmUgPSBmYWxzZVxuICB2YXIgdGhlaWQgPSBkYXRhLmlkIHx8IG5leHRpZFxuICBpZHNbdGhlaWRdID0ge1xuICAgIGlkOiB0aGVpZCxcbiAgICBkYXRhOiBuZGF0YSxcbiAgICBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgY29sbGFwc2VkOiAhIWNvbGxhcHNlLFxuICAgIGRlcHRoOiAwXG4gIH1cbiAgZm9yIChpPTA7IGk8Y2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBpZHNbY2hpbGRyZW5baV1dLnBhcmVudCA9IHRoZWlkO1xuICB9XG4gIHJldHVybiB7aWQ6IHRoZWlkLCB0cmVlOiBpZHN9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB1dWlkXG5cbnZhciBDSEFSUyA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonXG5mdW5jdGlvbiB1dWlkKGxuKSB7XG4gIGxuID0gbG4gfHwgMzJcbiAgdmFyIGlkID0gJydcbiAgZm9yICh2YXIgaT0wOyBpPGxuOyBpKyspIHtcbiAgICBpZCArPSBDSEFSU1twYXJzZUludChNYXRoLnJhbmRvbSgpICogQ0hBUlMubGVuZ3RoKV1cbiAgfVxuICByZXR1cm4gaWRcbn1cblxuIiwiXG52YXIga2V5SGFuZGxlciA9IHJlcXVpcmUoJy4va2V5LWhhbmRsZXInKVxuICAsIG5vcm1hbEFjdGlvbnMgPSByZXF1aXJlKCcuL25vcm1hbC1hY3Rpb25zJylcbiAgLCB2aXN1YWxBY3Rpb25zID0gcmVxdWlyZSgnLi92aXN1YWwtYWN0aW9ucycpXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlld1xuXG5mdW5jdGlvbiBlcWxpc3QoYSwgYikge1xuICBpZiAoYSA9PSBiKSByZXR1cm4gdHJ1ZVxuICBpZiAoIWEgfHwgIWIpIHJldHVybiBmYWxzZVxuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgZm9yICh2YXIgaT0wOyBpPGEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxudmFyIERvbVZpZXdMYXllciA9IHJlcXVpcmUoJy4vZG9tLXZsJylcbiAgLCBEZWZhdWx0Tm9kZSA9IHJlcXVpcmUoJy4vZGVmYXVsdC1ub2RlJylcbiAgLCBEdW5nZW9uc0FuZERyYWdvbnMgPSByZXF1aXJlKCcuL2RuZCcpXG4gICwga2V5cyA9IHJlcXVpcmUoJy4va2V5cycpXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG4gICwgZGVmYXVsdEtleXMgPSByZXF1aXJlKCcuL2RlZmF1bHQta2V5cycpXG5cbi8qKlxuICogVGhlIGJhc2ljIHZpZXdcbiAqXG4gKiBiaW5kQWN0aW9uczogZm4oKVxuICogbW9kZWw6IHRoZSBtb2RlbFxuICogYWN0aW9uczogdGhlIGNvbnRyb2xsZXIgYWN0aW9uc1xuICogb3B0aW9uczogb3B0aW9ucyBoYXNoXG4gKi9cbmZ1bmN0aW9uIFZpZXcoYmluZEFjdGlvbnMsIG1vZGVsLCBhY3Rpb25zLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHRoaXMubW9kZSA9ICdub3JtYWwnXG4gIHRoaXMuc2VsZWN0aW9uID0gbnVsbFxuICB0aGlzLnNlbF9pbnZlcnRlZCA9IGZhbHNlXG4gIHRoaXMuYWN0aXZlID0gbnVsbFxuICB0aGlzLm8gPSB1dGlsLmV4dGVuZCh7XG4gICAgTm9kZTogRGVmYXVsdE5vZGUsXG4gICAgVmlld0xheWVyOiBEb21WaWV3TGF5ZXIsXG4gICAgbm9TZWxlY3RSb290OiBmYWxzZSxcbiAgICBhbmltYXRlOiB0cnVlXG4gIH0sIG9wdGlvbnMpXG4gIHRoaXMuby5rZXliaW5kaW5ncyA9IHV0aWwubWVyZ2UodGhpcy5nZXREZWZhdWx0S2V5cygpLCBvcHRpb25zLmtleXMpXG4gIHRoaXMudmwgPSBuZXcgdGhpcy5vLlZpZXdMYXllcih0aGlzLm8pXG4gIHRoaXMuYmluZEFjdGlvbnMgPSBiaW5kQWN0aW9uc1xuICB0aGlzLm1vZGVsID0gbW9kZWxcbiAgdGhpcy5jdHJsYWN0aW9ucyA9IGFjdGlvbnNcbiAgdGhpcy5tb2RlbEFjdGlvbnMgPSBtb2RlbC5ib3VuZEFjdGlvbnNcbiAgLy8gYWN0dWFsbHkgRHJhZ0FuZERyb3BcbiAgdGhpcy5kbmQgPSBuZXcgRHVuZ2VvbnNBbmREcmFnb25zKHRoaXMudmwsIGFjdGlvbnMubW92ZSlcbiAgdGhpcy5sYXp5X2NoaWxkcmVuID0ge31cbiAgdGhpcy5fbGlzdGVuZXJzID0ge31cblxuICB0aGlzLm5ld05vZGUgPSBudWxsXG4gIHRoaXMuYXR0YWNoTGlzdGVuZXJzKClcbn1cblxuVmlldy5wcm90b3R5cGUgPSB7XG4gIGdldE5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy52bC5yb290XG4gIH0sXG5cbiAgZW1pdDogZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgaWYgKCF0aGlzLl9saXN0ZW5lcnNbZXZ0XSkgcmV0dXJuIGZhbHNlXG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMuX2xpc3RlbmVyc1tldnRdLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9saXN0ZW5lcnNbZXZ0XVtpXS5hcHBseSh0aGlzLCBhcmdzKVxuICAgIH1cbiAgfSxcblxuICBvbjogZnVuY3Rpb24gKGV2dCwgaGFuZGxlcikge1xuICAgIGlmICghdGhpcy5fbGlzdGVuZXJzW2V2dF0pIHtcbiAgICAgIHRoaXMuX2xpc3RlbmVyc1tldnRdID0gW11cbiAgICB9XG4gICAgdGhpcy5fbGlzdGVuZXJzW2V2dF0ucHVzaChoYW5kbGVyKVxuICB9LFxuXG4gIG9mZjogZnVuY3Rpb24gKGV2dCwgaGFuZGxlcikge1xuICAgIGlmICghdGhpcy5fbGlzdGVuZXJzW2V2dF0pIHJldHVybiBmYWxzZVxuICAgIHZhciBpID0gdGhpcy5fbGlzdGVuZXJzW2V2dF0uaW5kZXhPZihoYW5kbGVyKVxuICAgIGlmIChpID09PSAtMSkgcmV0dXJuIGZhbHNlXG4gICAgdGhpcy5fbGlzdGVuZXJzW2V2dF0uc3BsaWNlKGksIDEpXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdEtleXM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdXRpbC5tZXJnZShkZWZhdWx0S2V5cy52aWV3LmJhc2UsXG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdEtleXMudmlld1t1dGlsLmlzTWFjKCkgPyAnbWFjJyA6ICdwYyddKVxuICB9LFxuXG4gIHJlYmFzZTogZnVuY3Rpb24gKG5ld3Jvb3QsIHRyaWdnZXIpIHtcbiAgICB0aGlzLnZsLmNsZWFyKClcbiAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKVxuICAgIGlmICghdGhpcy5tb2RlbC5pZHNbbmV3cm9vdF0pIG5ld3Jvb3QgPSB0aGlzLm1vZGVsLnJvb3RcbiAgICB2YXIgcm9vdCA9IHRoaXMudmwucm9vdFxuICAgIHRoaXMuaW5pdGlhbGl6ZShuZXdyb290KVxuICAgIHRoaXMudmwucmViYXNlKHJvb3QpXG4gICAgdGhpcy5jdHJsYWN0aW9ucy50cmlnZ2VyKCdyZWJhc2UnLCBuZXdyb290KVxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLm1vZGVsLmlkc1tyb290XVxuICAgICAgLCByb290Tm9kZSA9IHRoaXMudmwubWFrZVJvb3Qobm9kZSwgdGhpcy5iaW5kQWN0aW9ucyhyb290KSwgdGhpcy5tb2RlbEFjdGlvbnMpXG4gICAgdGhpcy5hY3RpdmUgPSBudWxsXG4gICAgdGhpcy5zZWxlY3Rpb24gPSBudWxsXG4gICAgdGhpcy5sYXp5X2NoaWxkcmVuID0ge31cbiAgICB0aGlzLnJvb3QgPSByb290XG4gICAgdGhpcy5wb3B1bGF0ZUNoaWxkcmVuKHJvb3QpXG4gICAgaWYgKCFub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgdGhpcy5hZGROZXcodGhpcy5yb290LCAwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbW92ZU5ldygpXG4gICAgfVxuICAgIHRoaXMuc2VsZWN0U29tZXRoaW5nKClcbiAgICByZXR1cm4gcm9vdE5vZGVcbiAgfSxcblxuICBzdGFydE1vdmluZzogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHRhcmdldHMgPSB0aGlzLnZsLmRyb3BUYXJnZXRzKHRoaXMucm9vdCwgdGhpcy5tb2RlbCwgaWQsIHRydWUpXG4gICAgdGhpcy5kbmQuc3RhcnRNb3ZpbmcodGFyZ2V0cywgaWQpXG4gIH0sXG5cbiAgYWRkTmV3OiBmdW5jdGlvbiAocGlkLCBpbmRleCkge1xuICAgIHRoaXMubmV3Tm9kZSA9IHtcbiAgICAgIHBpZDogcGlkLFxuICAgICAgaW5kZXg6IGluZGV4XG4gICAgfVxuICAgIHZhciBiZWZvcmUgPSB0aGlzLm1vZGVsLmdldEJlZm9yZShwaWQsIGluZGV4LTEpXG4gICAgdGhpcy52bC5hZGROZXcoe1xuICAgICAgaWQ6ICduZXcnLFxuICAgICAgY29udGVudDogJycsXG4gICAgICBtZXRhOiB7fSxcbiAgICAgIHBhcmVudDogcGlkXG4gICAgfSwgdGhpcy5iaW5kQWN0aW9ucygnbmV3JyksIHRoaXMubW9kZWxBY3Rpb25zLCBiZWZvcmUpXG4gIH0sXG5cbiAgcmVtb3ZlTmV3OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLm5ld05vZGUpIHJldHVybiBmYWxzZVxuICAgIHZhciBudyA9IHRoaXMubmV3Tm9kZVxuICAgICAgLCBsYXN0Y2hpbGQgPSAhdGhpcy5tb2RlbC5pZHNbbncucGlkXS5jaGlsZHJlbi5sZW5ndGhcbiAgICB0aGlzLnZsLnJlbW92ZSgnbmV3JywgbncucGlkLCBsYXN0Y2hpbGQpXG4gICAgdGhpcy5uZXdOb2RlID0gbnVsbFxuICAgIHJldHVybiBud1xuICB9LFxuXG4gIHNlbGVjdFNvbWV0aGluZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZFxuICAgIGlmICghdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIGNoaWxkID0gJ25ldydcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGQgPSB0aGlzLm1vZGVsLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuWzBdXG4gICAgfVxuICAgIHRoaXMuZ29UbyhjaGlsZClcbiAgfSxcblxuICBwb3B1bGF0ZUNoaWxkcmVuOiBmdW5jdGlvbiAoaWQsIG5vZGUpIHtcbiAgICBub2RlID0gbm9kZSB8fCB0aGlzLm1vZGVsLmlkc1tpZF1cbiAgICBpZiAoIW5vZGUpIHJldHVyblxuICAgIGlmIChub2RlLmNvbGxhcHNlZCAmJiBpZCAhPT0gdGhpcy5yb290KSB7XG4gICAgICB0aGlzLmxhenlfY2hpbGRyZW5baWRdID0gdHJ1ZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMubGF6eV9jaGlsZHJlbltpZF0gPSBmYWxzZVxuICAgIHRoaXMudmwuY2xlYXJDaGlsZHJlbihpZClcbiAgICBpZiAoIW5vZGUuY2hpbGRyZW4gfHwgIW5vZGUuY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm5cbiAgICBmb3IgKHZhciBpPTA7IGk8bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5hZGQodGhpcy5tb2RlbC5pZHNbbm9kZS5jaGlsZHJlbltpXV0gfHwge2lkOiBub2RlLmNoaWxkcmVuW2ldLCBwYXJlbnQ6IGlkLCBjb250ZW50OiAnJywgY2hpbGRyZW46IFtdfSwgZmFsc2UsIHRydWUpXG4gICAgICB0aGlzLnBvcHVsYXRlQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSlcbiAgICB9XG4gIH0sXG5cbiAgZ29UbzogZnVuY3Rpb24gKGlkKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgIHRoaXMuc3RhcnRFZGl0aW5nKGlkKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldEFjdGl2ZShpZClcbiAgICB9XG4gIH0sXG5cbiAgZXh0cmFfYWN0aW9uczoge30sXG5cbiAga2V5SGFuZGxlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub3JtYWwgPSBrZXlIYW5kbGVyKFxuICAgICAgZGVmYXVsdEtleXMudmlldy5iYXNlLFxuICAgICAgbm9ybWFsQWN0aW9ucyxcbiAgICAgIHRoaXMuY3RybGFjdGlvbnNcbiAgICApXG5cbiAgICBpZiAodGhpcy5leHRyYV9hY3Rpb25zKSB7XG4gICAgICBmb3IgKHZhciBhY3Rpb24gaW4gdGhpcy5leHRyYV9hY3Rpb25zKSB7XG4gICAgICAgIG5vcm1hbFt0aGlzLmV4dHJhX2FjdGlvbnNbYWN0aW9uXS5iaW5kaW5nXSA9IHRoaXMuZXh0cmFfYWN0aW9uc1thY3Rpb25dLmFjdGlvblxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB2aXN1YWwgPSBrZXlIYW5kbGVyKGRlZmF1bHRLZXlzLnZpc3VhbCwgdmlzdWFsQWN0aW9ucywgdGhpcy5jdHJsYWN0aW9ucylcbiAgICB2YXIgaGFuZGxlcnMgPSB7XG4gICAgICAnaW5zZXJ0JzogZnVuY3Rpb24gKCkge30sXG4gICAgICAnbm9ybWFsJzoga2V5cyhub3JtYWwpLFxuICAgICAgJ3Zpc3VhbCc6IGtleXModmlzdWFsKSxcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGhhbmRsZXJzW3RoaXMubW9kZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0uYmluZCh0aGlzKVxuICB9LFxuXG4gIGF0dGFjaExpc3RlbmVyczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBrZXlkb3duID0gdGhpcy5rZXlIYW5kbGVyKClcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZS50YXJnZXQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHJldHVyblxuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHJldHVyblxuICAgICAga2V5ZG93bi5jYWxsKHRoaXMsIGUpXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIGFkZFRyZWU6IGZ1bmN0aW9uIChub2RlLCBiZWZvcmUpIHtcbiAgICBpZiAoIXRoaXMudmwuYm9keShub2RlLnBhcmVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShub2RlLnBhcmVudCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVOZXcoKVxuICAgIHRoaXMuYWRkKG5vZGUsIGJlZm9yZSlcbiAgICBpZiAoIW5vZGUuY2hpbGRyZW4gfHwgIW5vZGUuY2hpbGRyZW4ubGVuZ3RoKSByZXR1cm5cbiAgICBmb3IgKHZhciBpPTA7IGk8bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5hZGRUcmVlKHRoaXMubW9kZWwuaWRzW25vZGUuY2hpbGRyZW5baV1dLCBmYWxzZSlcbiAgICB9XG4gIH0sXG5cbiAgLy8gb3BlcmF0aW9uc1xuICBhZGQ6IGZ1bmN0aW9uIChub2RlLCBiZWZvcmUsIGRvbnRmb2N1cykge1xuICAgIHZhciBlZCA9IHRoaXMubW9kZSA9PT0gJ2luc2VydCdcbiAgICAgICwgY2hpbGRyZW4gPSBub2RlLmNoaWxkcmVuICYmICEhbm9kZS5jaGlsZHJlbi5sZW5ndGhcbiAgICBpZiAoIXRoaXMudmwuYm9keShub2RlLnBhcmVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShub2RlLnBhcmVudCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy52bC5hZGROZXcobm9kZSwgdGhpcy5iaW5kQWN0aW9ucyhub2RlLmlkKSwgdGhpcy5tb2RlbEFjdGlvbnMsIGJlZm9yZSwgY2hpbGRyZW4pXG4gICAgaWYgKCFkb250Zm9jdXMpIHtcbiAgICAgIGlmIChlZCkge1xuICAgICAgICB0aGlzLnZsLmJvZHkobm9kZS5pZCkuc3RhcnRFZGl0aW5nKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlKG5vZGUuaWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKGlkLCBub2RlKSB7XG4gICAgdmFyIG9sZCA9IHRoaXMubW9kZWwuaWRzW2lkXSB8fCB7fVxuICAgIGNvbnNvbGUubG9nKCd1cGRhdGUhJywgaWQsIG5vZGUsIG9sZClcbiAgICB2YXIgYm9keSA9IHRoaXMudmwuYm9keShpZClcbiAgICBpZiAoIWJvZHkpIHJldHVybiBjb25zb2xlLndhcm4oJ25vIGJvZHkgZm9yIHVwZGF0ZScpXG4gICAgaWYgKG5vZGUuY29udGVudCAhPT0gb2xkLmNvbnRlbnQpIHtcbiAgICAgIGJvZHkuc2V0Q29udGVudChub2RlLmNvbnRlbnQpXG4gICAgfVxuICAgIGlmICghZXFsaXN0KG5vZGUuY2hpbGRyZW4sIG9sZC5jaGlsZHJlbikpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDaGlsZHJlbihpZCwgbm9kZSlcbiAgICAgIC8vIFRPRE8gaGFuZGxlIHJlbW90ZSBkZWxldGlvbiBvZiB0aGUgYWN0aXZlIG5vZGUuXG4gICAgfVxuICAgIGJvZHkuc2V0TWV0YShub2RlLm1ldGEgfHwge30pXG4gICAgLy8gdGhpcyBjb3VsZCBnZXQgYW5ub3lpbmdcbiAgICBpZiAobm9kZS5jb2xsYXBzZWQgIT09IG9sZC5jb2xsYXBzZWQpIHtcbiAgICAgIHRoaXMuc2V0Q29sbGFwc2VkKGlkLCBub2RlLmNvbGxhcHNlZClcbiAgICB9XG4gIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoaWQsIGlnbm9yZUFjdGl2ZSkge1xuICAgIHZhciBwaWQgPSB0aGlzLm1vZGVsLmlkc1tpZF0ucGFyZW50XG4gICAgICAsIHBhcmVudCA9IHRoaXMubW9kZWwuaWRzW3BpZF1cbiAgICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShwaWQsIHRydWUpXG4gICAgfVxuICAgIGlmIChpZCA9PT0gdGhpcy5hY3RpdmUgJiYgIWlnbm9yZUFjdGl2ZSkge1xuICAgICAgdGhpcy5zZXRBY3RpdmUodGhpcy5yb290KVxuICAgIH1cbiAgICB0aGlzLnZsLnJlbW92ZShpZCwgcGlkLCBwYXJlbnQgJiYgcGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSlcbiAgICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKHBpZCA9PT0gdGhpcy5yb290KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFkZE5ldyhwaWQsIDApXG4gICAgICAgIH0uYmluZCh0aGlzKSwwKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzZXRDb250ZW50OiBmdW5jdGlvbiAoaWQsIGNvbnRlbnQpIHtcbiAgICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYmFzZShpZCwgdHJ1ZSlcbiAgICB9XG4gICAgdGhpcy52bC5ib2R5KGlkKS5zZXRDb250ZW50KGNvbnRlbnQpXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgIHRoaXMudmwuYm9keShpZCkuc3RhcnRFZGl0aW5nKClcbiAgICB9XG4gIH0sXG5cbiAgc2V0QXR0cjogZnVuY3Rpb24gKGlkLCBhdHRyLCB2YWx1ZSwgcXVpZXQpIHtcbiAgICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICAgIGlmIChxdWlldCkgcmV0dXJuXG4gICAgICByZXR1cm4gdGhpcy5yZWJhc2UoaWQsIHRydWUpXG4gICAgfVxuICAgIHRoaXMudmwuYm9keShpZCkuc2V0QXR0cihhdHRyLCB2YWx1ZSlcbiAgICBpZiAodGhpcy5tb2RlID09PSAnaW5zZXJ0JyAmJiAhcXVpZXQpIHtcbiAgICAgIHRoaXMudmwuYm9keShpZCkuc3RhcnRFZGl0aW5nKClcbiAgICB9XG4gIH0sXG5cbiAgcmVwbGFjZU1ldGE6IGZ1bmN0aW9uIChpZCwgbWV0YSkge1xuICAgIHRoaXMudmwuYm9keShpZCkucmVwbGFjZU1ldGEobWV0YSlcbiAgICBpZiAodGhpcy5tb2RlID09PSAnaW5zZXJ0Jykge1xuICAgICAgdGhpcy52bC5ib2R5KGlkKS5zdGFydEVkaXRpbmcoKVxuICAgIH1cbiAgfSxcblxuICBhcHBlbmRUZXh0OiBmdW5jdGlvbiAoaWQsIHRleHQpIHtcbiAgICB0aGlzLnZsLmJvZHkoaWQpLmFkZEVkaXRUZXh0KHRleHQpXG4gIH0sXG5cbiAgbW92ZTogZnVuY3Rpb24gKGlkLCBwaWQsIGJlZm9yZSwgcHBpZCwgbGFzdGNoaWxkKSB7XG4gICAgaWYgKCF0aGlzLnZsLmJvZHkoaWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWJhc2UodGhpcy5tb2RlbC5jb21tb25QYXJlbnQocGlkLCBwcGlkKSwgdHJ1ZSlcbiAgICB9XG4gICAgdmFyIGVkID0gdGhpcy5tb2RlID09PSAnaW5zZXJ0J1xuICAgIHRoaXMudmwubW92ZShpZCwgcGlkLCBiZWZvcmUsIHBwaWQsIGxhc3RjaGlsZClcbiAgICBpZiAoZWQpIHRoaXMuc3RhcnRFZGl0aW5nKGlkKVxuICB9LFxuXG4gIHN0YXJ0RWRpdGluZzogZnVuY3Rpb24gKGlkLCBmcm9tU3RhcnQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWQgPSB0aGlzLmFjdGl2ZSAhPT0gbnVsbCA/IHRoaXMuYWN0aXZlIDogdGhpcy5yb290XG4gICAgfVxuICAgIGlmIChpZCA9PT0gdGhpcy5yb290ICYmIHRoaXMuby5ub1NlbGVjdFJvb3QpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgYm9keSA9IHRoaXMudmwuYm9keShpZClcbiAgICBpZiAoIWJvZHkpIHJldHVyblxuICAgIGJvZHkuc3RhcnRFZGl0aW5nKGZyb21TdGFydClcbiAgfSxcblxuICBzdG9wRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm1vZGUgIT09ICdpbnNlcnQnKSByZXR1cm5cbiAgICBpZiAodGhpcy5hY3RpdmUgPT09IG51bGwpIHJldHVyblxuICAgIHRoaXMudmwuYm9keSh0aGlzLmFjdGl2ZSkuc3RvcEVkaXRpbmcoKVxuICB9LFxuXG4gIHNldEVkaXRpbmc6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmICh0aGlzLm1vZGUgPT09ICd2aXN1YWwnKSB7XG4gICAgICB0aGlzLnN0b3BTZWxlY3RpbmcoKVxuICAgIH1cbiAgICB0aGlzLm1vZGUgPSAnaW5zZXJ0J1xuICAgIHRoaXMuc2V0QWN0aXZlKGlkKVxuICB9LFxuXG4gIGRvbmVFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tb2RlID0gJ25vcm1hbCdcbiAgfSxcblxuICBzZXRBY3RpdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmIChpZCA9PT0gdGhpcy5hY3RpdmUpIHJldHVybiB0aGlzLnZsLnNob3dBY3RpdmUoaWQpXG4gICAgaWYgKHRoaXMuYWN0aXZlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZsLmNsZWFyQWN0aXZlKHRoaXMuYWN0aXZlKVxuICAgIH1cbiAgICBpZiAoIXRoaXMudmwuZG9tW2lkXSkge1xuICAgICAgaWQgPSB0aGlzLnJvb3RcbiAgICB9XG4gICAgdGhpcy5hY3RpdmUgPSBpZFxuICAgIHRoaXMudmwuc2hvd0FjdGl2ZShpZClcbiAgfSxcblxuICBnZXRBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMudmwuZG9tW3RoaXMuYWN0aXZlXSkge1xuICAgICAgcmV0dXJuIHRoaXMucm9vdFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgfSxcblxuICBhZGRUb1NlbGVjdGlvbjogZnVuY3Rpb24gKGlkLCBpbnZlcnQpIHtcbiAgICB2YXIgaXggPSB0aGlzLnNlbGVjdGlvbi5pbmRleE9mKGlkKVxuICAgIGlmIChpeCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uLnB1c2goaWQpXG4gICAgICB0aGlzLnZsLnNob3dTZWxlY3Rpb24oW2lkXSlcbiAgICAgIHRoaXMuc2VsX2ludmVydGVkID0gaW52ZXJ0XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmwuY2xlYXJTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24uc2xpY2UoaXggKyAxKSlcbiAgICAgIHRoaXMuc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb24uc2xpY2UoMCwgaXggKyAxKVxuICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLnNlbF9pbnZlcnRlZCA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2V0QWN0aXZlKGlkKVxuICAgIGNvbnNvbGUubG9nKHRoaXMuc2VsX2ludmVydGVkKVxuICB9LFxuXG4gIHNldFNlbGVjdGlvbjogZnVuY3Rpb24gKHNlbCkge1xuICAgIHRoaXMubW9kZSA9ICd2aXN1YWwnXG4gICAgdGhpcy5zZWxfaW52ZXJ0ZWQgPSBmYWxzZVxuICAgIGlmICh0aGlzLnNlbGVjdGlvbikge1xuICAgICAgdGhpcy52bC5jbGVhclNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbilcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb24gPSBzZWxcbiAgICB0aGlzLnZsLnNob3dTZWxlY3Rpb24oc2VsKVxuICB9LFxuXG4gIHN0b3BTZWxlY3Rpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT09IG51bGwpIHtcbiAgICAgIHRoaXMudmwuY2xlYXJTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24pXG4gICAgICB0aGlzLnNlbGVjdGlvbiA9IG51bGxcbiAgICB9XG4gICAgdGhpcy5tb2RlID0gJ25vcm1hbCdcbiAgfSxcblxuICBzZXRDb2xsYXBzZWQ6IGZ1bmN0aW9uIChpZCwgd2hhdCkge1xuICAgIC8qXG4gICAgaWYgKCF0aGlzLnZsLmJvZHkoaWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWJhc2UodGhpcy5tb2RlbC5pZHNbaWRdLnBhcmVudClcbiAgICB9XG4gICAgKi9cbiAgICBpZiAod2hhdCkge1xuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgdGhpcy5zdGFydEVkaXRpbmcoaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldEFjdGl2ZShpZClcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm8uYW5pbWF0ZSkge1xuICAgICAgICB0aGlzLnZsLmFuaW1hdGVDbG9zZWQoaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnZsLnNldENvbGxhcHNlZChpZCwgdHJ1ZSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubGF6eV9jaGlsZHJlbltpZF0pIHtcbiAgICAgICAgdGhpcy5wb3B1bGF0ZUNoaWxkcmVuKGlkKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuby5hbmltYXRlKSB7XG4gICAgICAgIHRoaXMudmwuYW5pbWF0ZU9wZW4oaWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnZsLnNldENvbGxhcHNlZChpZCwgZmFsc2UpXG4gICAgICB9XG4gICAgfVxuICAgIC8vIFRPRE86IGV2ZW50IGxpc3RlbmVycz9cbiAgfSxcblxuICAvLyBub24tbW9kaWZ5aW5nIHN0dWZmXG4gIGdvVXA6IGZ1bmN0aW9uIChpZCkge1xuICAgIC8vIHNob3VsZCBJIGNoZWNrIHRvIHNlZSBpZiBpdCdzIG9rP1xuICAgIHZhciBhYm92ZSA9IHRoaXMubW9kZWwuaWRBYm92ZShpZClcbiAgICBpZiAoYWJvdmUgPT09IGZhbHNlKSByZXR1cm5cbiAgICBpZiAoYWJvdmUgPT09IHRoaXMucm9vdCAmJiB0aGlzLm8ubm9TZWxlY3RSb290KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy52bC5ib2R5KGFib3ZlKS5ib2R5LnN0YXJ0RWRpdGluZygpO1xuICB9LFxuXG4gIGdvRG93bjogZnVuY3Rpb24gKGlkLCBmcm9tU3RhcnQpIHtcbiAgICB2YXIgYmVsb3cgPSB0aGlzLm1vZGVsLmlkQmVsb3coaWQsIHRoaXMucm9vdClcbiAgICBpZiAoYmVsb3cgPT09IGZhbHNlKSByZXR1cm5cbiAgICB0aGlzLnZsLmJvZHkoYmVsb3cpLmJvZHkuc3RhcnRFZGl0aW5nKGZyb21TdGFydClcbiAgfSxcbn1cblxuIiwiXG5mdW5jdGlvbiByZXZlcnNlZChpdGVtcykge1xuICB2YXIgbncgPSBbXVxuICBmb3IgKHZhciBpPWl0ZW1zLmxlbmd0aDsgaT4wOyBpLS0pIHtcbiAgICBudy5wdXNoKGl0ZW1zW2kgLSAxXSlcbiAgfVxuICByZXR1cm4gbndcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIG1vdmVtZW50XG4gICdzZWxlY3QgdXAnOiB7XG4gICAgaGVscDogJ21vdmUgdGhlIGN1cnNvciB1cCcsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcHJldiA9IHRoaXMubW9kZWwucHJldlNpYmxpbmcodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgICBpZiAoIXByZXYpIHJldHVyblxuICAgICAgdGhpcy5hZGRUb1NlbGVjdGlvbihwcmV2LCB0cnVlKVxuICAgIH0sXG4gIH0sXG5cbiAgJ3NlbGVjdCBkb3duJzoge1xuICAgIGhlbHA6ICdtb3ZlIHRoZSBjdXJzb3IgZG93bicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbmV4dCA9IHRoaXMubW9kZWwubmV4dFNpYmxpbmcodGhpcy5hY3RpdmUsIHRydWUpXG4gICAgICBpZiAoIW5leHQpIHJldHVyblxuICAgICAgdGhpcy5hZGRUb1NlbGVjdGlvbihuZXh0LCBmYWxzZSlcbiAgICB9LFxuICB9LFxuXG4gICdzZWxlY3QgdG8gYm90dG9tJzoge1xuICAgIGhlbHA6ICdtb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIGJvdHRvbScsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbiA9IHRoaXMubW9kZWwuaWRzW3RoaXMuc2VsZWN0aW9uWzBdXVxuICAgICAgICAsIGNoID0gdGhpcy5tb2RlbC5pZHNbbi5wYXJlbnRdLmNoaWxkcmVuXG4gICAgICAgICwgaXggPSBjaC5pbmRleE9mKHRoaXMuc2VsZWN0aW9uWzBdKVxuICAgICAgdGhpcy5zZXRTZWxlY3Rpb24oY2guc2xpY2UoaXgpKVxuICAgICAgdGhpcy5zZWxfaW52ZXJ0ZWQgPSBmYWxzZVxuICAgICAgdGhpcy5zZXRBY3RpdmUoY2hbY2gubGVuZ3RoLTFdKVxuICAgIH0sXG4gIH0sXG5cbiAgJ3NlbGVjdCB0byB0b3AnOiB7XG4gICAgaGVscDogJ21vdmUgdGhlIGN1cnNvciB0byB0aGUgdG9wJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBuID0gdGhpcy5tb2RlbC5pZHNbdGhpcy5zZWxlY3Rpb25bMF1dXG4gICAgICAgICwgY2ggPSB0aGlzLm1vZGVsLmlkc1tuLnBhcmVudF0uY2hpbGRyZW5cbiAgICAgICAgLCBpeCA9IGNoLmluZGV4T2YodGhpcy5zZWxlY3Rpb25bMF0pXG4gICAgICAgICwgaXRlbXMgPSBbXVxuICAgICAgZm9yICh2YXIgaT0wOyBpPD1peDsgaSsrKSB7XG4gICAgICAgIGl0ZW1zLnVuc2hpZnQoY2hbaV0pXG4gICAgICB9XG4gICAgICB0aGlzLnNldFNlbGVjdGlvbihpdGVtcylcbiAgICAgIHRoaXMuc2VsX2ludmVydGVkID0gaXRlbXMubGVuZ3RoID4gMVxuICAgICAgdGhpcy5zZXRBY3RpdmUoY2hbMF0pXG4gICAgfSxcbiAgfSxcblxuICAnc3RvcCBzZWxlY3RpbmcnOiB7XG4gICAgaGVscDogJ3F1aXQgc2VsZWN0aW9uIG1vZGUnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICB9LFxuICB9LFxuXG4gICdlZGl0Jzoge1xuICAgIGhlbHA6ICdzdGFydCBlZGl0aW5nIHRoZSBhY3RpdmUgbm9kZScsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0YXJ0RWRpdGluZyh0aGlzLmFjdGl2ZSlcbiAgICB9LFxuICB9LFxuXG4gICdlZGl0IHN0YXJ0Jzoge1xuICAgIGhlbHA6ICdlZGl0IGF0IHRoZSBzdGFydCBvZiB0aGUgbm9kZScsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnN0YXJ0RWRpdGluZyh0aGlzLmFjdGl2ZSwgdHJ1ZSlcbiAgICB9LFxuICB9LFxuXG4gICAgLy8gZWRpdG5lc3NcbiAgJ2N1dCc6IHtcbiAgICBoZWxwOiAnY3V0IHRoZSBjdXJyZW50IHNlbGVjdGlvbicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaXRlbXMgPSB0aGlzLnNlbGVjdGlvbi5zbGljZSgpXG4gICAgICBpZiAodGhpcy5zZWxfaW52ZXJ0ZWQpIHtcbiAgICAgICAgaXRlbXMgPSByZXZlcnNlZChpdGVtcylcbiAgICAgIH1cbiAgICAgIHRoaXMuY3RybGFjdGlvbnMuY3V0KGl0ZW1zKVxuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICB9LFxuICB9LFxuXG4gICdjb3B5Jzoge1xuICAgIGhlbHA6ICdjb3B5IHRoZSBjdXJyZW50IHNlbGVjdGlvbicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaXRlbXMgPSB0aGlzLnNlbGVjdGlvbi5zbGljZSgpXG4gICAgICBpZiAodGhpcy5zZWxfaW52ZXJ0ZWQpIHtcbiAgICAgICAgaXRlbXMgPSByZXZlcnNlZChpdGVtcylcbiAgICAgIH1cbiAgICAgIHRoaXMuY3RybGFjdGlvbnMuY29weShpdGVtcylcbiAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gICAgfSxcbiAgfSxcblxuICAndW5kbyc6IHtcbiAgICBoZWxwOiAndW5kbyB0aGUgbGFzdCBjaGFuZ2UnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zdG9wU2VsZWN0aW5nKClcbiAgICAgIHRoaXMuY3RybGFjdGlvbnMudW5kbygpXG4gICAgfSxcbiAgfSxcblxuICAncmVkbyc6IHtcbiAgICBoZWxwOiAncmVkbyB0aGUgbGFzdCB1bmRvJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpXG4gICAgICB0aGlzLmN0cmxhY3Rpb25zLnJlZG8oKVxuICAgIH0sXG4gIH0sXG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja1xuXG5mdW5jdGlvbiB1bkVzY2FwZUh0bWwoc3RyKSB7XG4gIGlmICghc3RyKSByZXR1cm4gJyc7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvPGRpdj4vZywgJ1xcbicpLnJlcGxhY2UoLzxicj4vZywgJ1xcbicpXG4gICAgLnJlcGxhY2UoLzxcXC9kaXY+L2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHUyMDBiL2csICcnKVxufVxuXG4vKipcbiAqIENvbmZpZyBsb29rcyBsaWtlOlxuICoge1xuICogICB0b3A6IG51bSxcbiAqICAgbGVmdDogbnVtLCAoZnJvbSBtZXRhLndoaXRlYm9hcmQpXG4gKiAgfVxuICogT3B0aW9ucyBsb29rcyBsaWtlOlxuICoge1xuICogIHNhdmVDb25maWdcbiAqICBzYXZlQ29udGVudFxuICogIGNoYW5nZUNvbnRlbnRcbiAqICBzdGFydE1vdmluZyhldmVudCwgcmVjdCwgP3NoaWZ0TW92ZSlcbiAqICBzdGFydE1vdmluZ0NoaWxkKGV2ZW50LCBpZCwgP3NoaWZ0TW92ZSlcbiAqICBvblpvb21cbiAqIH1cbiAqL1xuZnVuY3Rpb24gQmxvY2soZGF0YSwgY2hpbGRyZW4sIGNvbmZpZywgb3B0aW9ucykge1xuICB0aGlzLm8gPSBvcHRpb25zXG4gIHRoaXMuZWRpdGluZyA9IGZhbHNlXG4gIHRoaXMuX21vdmVkID0gZmFsc2VcbiAgdGhpcy5zZXR1cE5vZGUoZGF0YSwgY2hpbGRyZW4pXG4gIHRoaXMucmVwb3NpdGlvbihjb25maWcubGVmdCwgY29uZmlnLnRvcCwgdHJ1ZSlcbiAgLy8gdGhpcy5yZXNpemUoY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0LCB0cnVlKVxufVxuXG5CbG9jay5wcm90b3R5cGUgPSB7XG4gIHNldHVwTm9kZTogZnVuY3Rpb24gKGRhdGEsIGNoaWxkcmVuKSB7XG4gICAgdGhpcy5ub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLm5vZGUuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmQtaXRlbSdcbiAgICAvLyB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24uYmluZCh0aGlzKSlcbiAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX29uTW91c2VVcC5iaW5kKHRoaXMpKVxuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpKVxuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bi5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy50aXRsZS5jbGFzc05hbWU9J3doaXRlYm9hcmQtaXRlbV90aXRsZSdcbiAgICAvLyB0aGlzLnRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGljay5iaW5kKHRoaXMpKVxuICAgIHRoaXMudGl0bGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpXG4gICAgdGhpcy50aXRsZS5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuby5vblpvb20pXG5cbiAgICB0aGlzLmlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmlucHV0LnNldEF0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJywgdHJ1ZSlcbiAgICB0aGlzLmlucHV0LmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWl0ZW1faW5wdXQnXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fb25CbHVyLmJpbmQodGhpcykpXG5cbiAgICB0aGlzLmJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpXG4gICAgdGhpcy5ib2R5LmNsYXNzTmFtZT0nd2hpdGVib2FyZC1pdGVtX2JvZHknXG5cbiAgICB2YXIgem9vbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgem9vbS5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1pdGVtX3pvb20nXG4gICAgem9vbS5pbm5lckhUTUwgPSAnPGkgY2xhc3M9XCJmYSBmYS1leHBhbmRcIi8+J1xuICAgIHpvb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm8ub25ab29tKVxuXG4gICAgdGhpcy5jaGlsZHJlbiA9IHt9XG5cbiAgICBjaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZUNoaWxkKGNoaWxkKVxuICAgICAgLy8gbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93bkNoaWxkLmJpbmQodGhpcywgY2hpbGQuaWQpKVxuICAgICAgdGhpcy5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG4gICAgICB0aGlzLmNoaWxkcmVuW2NoaWxkLmlkXSA9IG5vZGVcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICAvKlxuICAgIHRoaXMuZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmZvb3Rlci5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1pdGVtX2Zvb3RlcidcbiAgICB2YXIgem9vbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKVxuICAgIHpvb20uY2xhc3NOYW1lID0gJ2ZhIGZhLWV4cGFuZCB6b29tJ1xuICAgIHpvb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm8ub25ab29tKVxuICAgIHRoaXMuZm9vdGVyLmFwcGVuZENoaWxkKHpvb20pXG4gICAgKi9cblxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLnRpdGxlKVxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLmJvZHkpXG4gICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHpvb20pXG4gICAgLy8gdGhpcy5ub2RlLmFwcGVuZENoaWxkKHRoaXMuZm9vdGVyKVxuXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChkYXRhLmNvbnRlbnQpXG4gICAgdGhpcy5jb250ZW50ID0gZGF0YS5jb250ZW50XG4gICAgcmV0dXJuIHRoaXMubm9kZVxuICB9LFxuXG4gIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZSlcbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuXG4gIC8qKlxuICAgKiBwaWQ6IHRoZSBpZCBvZiB0aGlzIGJsb2NrXG4gICAqIGNpZDogdGhlIGNoaWxkIHRoYXQgaXMgYmVpbmcgbW92ZWRcbiAgICogY2hpbGRyZW46IGxpc3Qgb2YgY2hpbGQgaWRzXG4gICAqL1xuICBnZXRDaGlsZFRhcmdldHM6IGZ1bmN0aW9uIChjaWQsIGJpZCwgY2hpbGRyZW4pIHtcbiAgICB2YXIgdGFyZ2V0cyA9IGNoaWxkcmVuID8gY2hpbGRyZW4ubWFwKHRoaXMuY2hpbGRUYXJnZXQuYmluZCh0aGlzLCBiaWQpKSA6IFtdXG4gICAgdGFyZ2V0cy5wdXNoKHRoaXMud2hvbGVUYXJnZXQoYmlkLCBjaGlsZHJlbi5sZW5ndGgpKVxuICAgIHJldHVybiB0YXJnZXRzXG4gIH0sXG5cbiAgY2hpbGRUYXJnZXQ6IGZ1bmN0aW9uIChwaWQsIGlkLCBpKSB7XG4gICAgdmFyIGJveCA9IHRoaXMuY2hpbGRyZW5baWRdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIG1hZ2ljID0gMTBcbiAgICByZXR1cm4ge1xuICAgICAgaGl0OiB7XG4gICAgICAgIGxlZnQ6IGJveC5sZWZ0LFxuICAgICAgICByaWdodDogYm94LnJpZ2h0LFxuICAgICAgICB0b3A6IGJveC50b3AgLSBtYWdpYyxcbiAgICAgICAgYm90dG9tOiBib3guYm90dG9tIC0gbWFnaWNcbiAgICAgIH0sXG4gICAgICBwb3M6IGksXG4gICAgICBwaWQ6IHBpZCxcbiAgICAgIGRyYXc6IHtcbiAgICAgICAgbGVmdDogYm94LmxlZnQsXG4gICAgICAgIHdpZHRoOiBib3gud2lkdGgsXG4gICAgICAgIHRvcDogYm94LnRvcCAtIG1hZ2ljLzIsXG4gICAgICAgIGhlaWdodDogbWFnaWNcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIGlkOiB0aGUgYm94IGlkXG4gICAqIGxhc3Q6IHRoZSBsYXN0IGluZGV4IGluIHRoZSBjaGlsZCBsaXN0XG4gICAqL1xuICB3aG9sZVRhcmdldDogZnVuY3Rpb24gKGlkLCBsYXN0KSB7XG4gICAgdmFyIGJveCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgLCBtYWdpYyA9IDEwXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpdDogYm94LFxuICAgICAgcGlkOiBpZCxcbiAgICAgIHBvczogbGFzdCxcbiAgICAgIGRyYXc6IHtcbiAgICAgICAgdG9wOiBib3guYm90dG9tIC0gbWFnaWMsXG4gICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgbWFnaWMvMixcbiAgICAgICAgaGVpZ2h0OiBtYWdpYyxcbiAgICAgICAgd2lkdGg6IGJveC53aWR0aCAtIG1hZ2ljXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG5cbiAgLy8gQ2hpbGRyZW4hIVxuXG5cbiAgLy8gTm90IGNoaWxkcmVuISFcblxuICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB0aGlzLnJlcG9zaXRpb24oY29uZmlnLmxlZnQsIGNvbmZpZy50b3AsIHRydWUpXG4gICAgLy8gdGhpcy5yZXNpemUoY29uZmlnLndpZHRoLCBjb25maWcuaGVpZ2h0LCB0cnVlKVxuICB9LFxuXG4gIHNldENvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgaWYgKGNvbnRlbnQgPT09IHRoaXMuY29udGVudCkgcmV0dXJuXG4gICAgdGhpcy5zZXRUZXh0Q29udGVudChjb250ZW50KVxuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZShjb250ZW50KVxuICB9LFxuXG4gIF9vbkJsdXI6IGZ1bmN0aW9uIChlKSB7XG4gICAgdGhpcy5zdG9wRWRpdGluZygpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgX29uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2hhbmRsZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFlLnNoaWZ0S2V5KSByZXR1cm5cbiAgICB2YXIgcmVjdCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGlmICh0aGlzLm8uc3RhcnRNb3ZpbmcoZSwgcmVjdCwgdHJ1ZSkpIHtcbiAgICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLWl0ZW0tLW1vdmluZycpXG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gIH0sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMuX21vdmVkKSB7XG4gICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5zdGFydEVkaXRpbmcoKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIF9vbk1vdXNlTW92ZUNoaWxkOiBmdW5jdGlvbiAoaWQsIGUpIHtcbiAgICBpZiAoIWUuc2hpZnRLZXkpIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHZhciBjbG9uZSA9IHRoaXMuY2hpbGRyZW5baWRdLmxhc3RDaGlsZC5jbG9uZU5vZGUodHJ1ZSlcbiAgICBpZiAodGhpcy5vLnN0YXJ0TW92aW5nQ2hpbGQoZSwgaWQsIGNsb25lLCB0cnVlKSkge1xuICAgICAgdGhpcy5jaGlsZHJlbltpZF0uY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1tb3ZpbmcnKVxuICAgIH1cbiAgfSxcblxuICBfb25Nb3VzZURvd25DaGlsZDogZnVuY3Rpb24gKGlkLCBlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHZhciBjbG9uZSA9IHRoaXMuY2hpbGRyZW5baWRdLmxhc3RDaGlsZC5jbG9uZU5vZGUodHJ1ZSlcbiAgICBpZiAodGhpcy5vLnN0YXJ0TW92aW5nQ2hpbGQoZSwgaWQsIGNsb25lKSkge1xuICAgICAgdGhpcy5jaGlsZHJlbltpZF0uY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1tb3ZpbmcnKVxuICAgIH1cbiAgfSxcblxuICBfb25Nb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5fbW92ZWQgPSBmYWxzZVxuICAgIGlmIChlLnRhcmdldCAhPT0gdGhpcy5pbnB1dCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKVxuICAgIH1cbiAgICB2YXIgcmVjdCA9IHRoaXMubm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLWl0ZW0tLW1vdmluZycpXG4gICAgdGhpcy5vLnN0YXJ0TW92aW5nKGUsIHJlY3QpXG4gICAgICAvLywgdG9wID0gZS5jbGllbnRZIC0gcmVjdC50b3BcbiAgICAgIC8vLCBsZWZ0ID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0XG4gICAgLyoqXG4gICAgICogVE9ETzogcmVzaXphYmlsaXR5ID9cbiAgICBpZiAobGVmdCA+IHJlY3Qud2lkdGggLSAxMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhcnRSZXNpemluZygneCcpXG4gICAgfVxuICAgIGlmICh0b3AgPiByZWN0LmhlaWdodCAtIDEwKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFydFJlc2l6aW5nKCd5JylcbiAgICB9XG4gICAgICovXG4gICAgLy90aGlzLm8uc3RhcnRNb3ZpbmcobGVmdCwgdG9wKVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIHJlbW92ZUNoaWxkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICBpZiAoIXRoaXMuY2hpbGRyZW5baWRdKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbltpZF0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNoaWxkcmVuW2lkXSlcbiAgICBkZWxldGUgdGhpcy5jaGlsZHJlbltpZF1cbiAgfSxcblxuICBhZGRDaGlsZDogZnVuY3Rpb24gKGNoaWxkLCBpZCwgYmVmb3JlKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZUNoaWxkKGNoaWxkKVxuICAgIGlmIChiZWZvcmUgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ib2R5Lmluc2VydEJlZm9yZShub2RlLCB0aGlzLmNoaWxkcmVuW2JlZm9yZV0pXG4gICAgfVxuICAgIHRoaXMuY2hpbGRyZW5baWRdID0gbm9kZVxuICB9LFxuXG4gIGNyZWF0ZUNoaWxkOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICBub2RlLmNsYXNzTmFtZT0nd2hpdGVib2FyZC1pdGVtX2NoaWxkJ1xuICAgIGlmIChjaGlsZC5jaGlsZHJlbiAmJiBjaGlsZC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtX2NoaWxkLS1wYXJlbnQnKVxuICAgIH1cbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgYm9keS5pbm5lckhUTUwgPSBjaGlsZC5jb250ZW50ID8gbWFya2VkKGNoaWxkLmNvbnRlbnQpIDogJzxlbT5DbGljayBoZXJlIHRvIGVkaXQ8L2VtPidcbiAgICB2YXIgaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBoYW5kbGUuY2xhc3NOYW1lID0gJ2hhbmRsZSdcbiAgICBoYW5kbGUuaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtY2lyY2xlXCIvPidcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmVDaGlsZC5iaW5kKHRoaXMsIGNoaWxkLmlkKSlcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd25DaGlsZC5iaW5kKHRoaXMsIGNoaWxkLmlkKSlcbiAgICBub2RlLmFwcGVuZENoaWxkKGhhbmRsZSlcbiAgICBub2RlLmFwcGVuZENoaWxkKGJvZHkpXG4gICAgcmV0dXJuIG5vZGVcbiAgfSxcblxuICBkb25lTW92aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3doaXRlYm9hcmQtaXRlbS0tbW92aW5nJylcbiAgfSxcblxuICBkb25lTW92aW5nQ2hpbGQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHRoaXMuY2hpbGRyZW5baWRdLmNsYXNzTGlzdC5yZW1vdmUoJ3doaXRlYm9hcmQtaXRlbV9jaGlsZC0tbW92aW5nJylcbiAgfSxcblxuICBzdGFydEVkaXRpbmc6IGZ1bmN0aW9uIChmcm9tU3RhcnQpIHtcbiAgICBpZiAodGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICB0aGlzLm5vZGUuY2xhc3NMaXN0LmFkZCgnd2hpdGVib2FyZC1pdGVtLS1lZGl0aW5nJylcbiAgICB0aGlzLmVkaXRpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0SW5wdXRWYWx1ZSh0aGlzLmNvbnRlbnQpXG4gICAgdGhpcy5ub2RlLnJlcGxhY2VDaGlsZCh0aGlzLmlucHV0LCB0aGlzLnRpdGxlKVxuICAgIHRoaXMuaW5wdXQuZm9jdXMoKTtcbiAgICB0aGlzLnNldFNlbGVjdGlvbighZnJvbVN0YXJ0KVxuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmVkaXRpbmcpIHJldHVyblxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd3aGl0ZWJvYXJkLWl0ZW0tLWVkaXRpbmcnKVxuICAgIGNvbnNvbGUubG9nKCdzdG9wIGVkZGludCcsIHRoaXMuaXNOZXcpXG4gICAgdmFyIHZhbHVlID0gdGhpcy5nZXRJbnB1dFZhbHVlKClcbiAgICB0aGlzLmVkaXRpbmcgPSBmYWxzZVxuICAgIHRoaXMubm9kZS5yZXBsYWNlQ2hpbGQodGhpcy50aXRsZSwgdGhpcy5pbnB1dClcbiAgICBpZiAodGhpcy5jb250ZW50ICE9IHZhbHVlKSB7XG4gICAgICB0aGlzLnNldFRleHRDb250ZW50KHZhbHVlKVxuICAgICAgdGhpcy5jb250ZW50ID0gdmFsdWVcbiAgICAgIHRoaXMuby5jaGFuZ2VDb250ZW50KHRoaXMuY29udGVudClcbiAgICB9XG4gIH0sXG5cbiAgc2V0U2VsZWN0aW9uOiBmdW5jdGlvbiAoZW5kKSB7XG4gICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuICAgIHNlbC5zZWxlY3RBbGxDaGlsZHJlbih0aGlzLmlucHV0KVxuICAgIHRyeSB7XG4gICAgICBzZWxbJ2NvbGxhcHNlVG8nICsgKGVuZCA/ICdFbmQnIDogJ1N0YXJ0JyldKClcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9LFxuXG4gIGZvY3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zdGFydEVkaXRpbmcoKVxuICB9LFxuXG4gIHNldFRleHRDb250ZW50OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnRpdGxlLmlubmVySFRNTCA9IHZhbHVlID8gbWFya2VkKHZhbHVlKSA6ICcnXG4gIH0sXG5cbiAgc2V0SW5wdXRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5pbnB1dC5pbm5lckhUTUwgPSB2YWx1ZVxuICB9LFxuXG4gIGdldElucHV0VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdW5Fc2NhcGVIdG1sKHRoaXMuaW5wdXQuaW5uZXJIVE1MKVxuICB9LFxuXG4gIHJlcG9zaXRpb246IGZ1bmN0aW9uICh4LCB5LCBzaWxlbnQpIHtcbiAgICBpZiAoeCAhPT0gdGhpcy54IHx8IHkgIT09IHRoaXMueSkge1xuICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXG4gICAgfVxuICAgIHRoaXMueCA9IHhcbiAgICB0aGlzLnkgPSB5XG4gICAgdGhpcy5ub2RlLnN0eWxlLnRvcCA9IHkgKyAncHgnXG4gICAgdGhpcy5ub2RlLnN0eWxlLmxlZnQgPSB4ICsgJ3B4J1xuICAgIGlmICghc2lsZW50KSB7XG4gICAgICB0aGlzLnNhdmVDb25maWcoKVxuICAgIH1cbiAgfSxcblxuICByZXNpemU6IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBzaWxlbnQpIHtcbiAgICB0aGlzLndpZHRoID0gd2lkdGhcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxuICAgIHRoaXMubm9kZS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4J1xuICAgIHRoaXMubm9kZS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHRoaXMuc2F2ZUNvbmZpZygpXG4gICAgfVxuICB9LFxuXG4gIHNhdmVDb25maWc6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm8uc2F2ZUNvbmZpZyh7XG4gICAgICBsZWZ0OiB0aGlzLngsXG4gICAgICB0b3A6IHRoaXMueSxcbiAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodFxuICAgIH0pXG4gIH0sXG5cbiAgc2F2ZUNvbnRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm8uc2F2ZUNvbnRlbnQodGhpcy5jb250ZW50KVxuICB9LFxuXG4gIG1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcbiAgfSxcblxuICBtb3VzZVVwOiBmdW5jdGlvbiAoZSkge1xuICB9LFxuXG4gIGNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIHRoaXMuc3RhcnRFZGl0aW5nKClcbiAgfSxcblxuICBibHVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zdG9wRWRpdGluZygpXG4gIH0sXG5cbiAga2V5RG93bjogZnVuY3Rpb24gKGUpIHtcbiAgfVxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICBWaWV3OiByZXF1aXJlKCcuL3ZpZXcnKVxufVxuXG4iLCJcbnZhciBEdW5nZW9uc0FuZERyYWdvbnMgPSByZXF1aXJlKCcuLi8uLi9saWIvZG5kLmpzJylcbnZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2snKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdcblxuZnVuY3Rpb24gVmlldyhiaW5kQWN0aW9ucywgbW9kZWwsIGFjdGlvbnMsIG9wdGlvbnMpIHtcbiAgdGhpcy5tb2RlID0gJ25vcm1hbCdcbiAgdGhpcy5hY3RpdmUgPSBudWxsXG4gIHRoaXMuaWRzID0ge31cblxuICB0aGlzLmJpbmRBY3Rpb25zID0gYmluZEFjdGlvbnNcbiAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gIHRoaXMuY3RybGFjdGlvbnMgPSBhY3Rpb25zXG5cbiAgdGhpcy5fYm91bmRNb3ZlID0gdGhpcy5fb25Nb3VzZU1vdmUuYmluZCh0aGlzKVxuICB0aGlzLl9ib3VuZFVwID0gdGhpcy5fb25Nb3VzZVVwLmJpbmQodGhpcylcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9vbktleVVwLmJpbmQodGhpcykpXG59XG5cblZpZXcucHJvdG90eXBlID0ge1xuICBpbml0aWFsaXplOiBmdW5jdGlvbiAocm9vdCkge1xuICAgIHZhciBub2RlID0gdGhpcy5tb2RlbC5pZHNbcm9vdF1cbiAgICB0aGlzLnNldHVwUm9vdCgpXG4gICAgdGhpcy5yb290ID0gcm9vdFxuICAgIHRoaXMubWFrZUJsb2Nrcyhyb290KVxuICAgIHJldHVybiB0aGlzLnJvb3ROb2RlXG4gIH0sXG5cbiAgc2V0dXBSb290OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJvb3ROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICByb290Tm9kZS5jbGFzc05hbWU9J3doaXRlYm9hcmQnXG4gICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpXG4gICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24uYmluZCh0aGlzKSlcbiAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX29uV2hlZWwuYmluZCh0aGlzKSlcblxuICAgIHRoaXMuaGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5oZWFkLmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWhlYWQnXG4gICAgdGhpcy5oZWFkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fb25DbGlja0hlYWQuYmluZCh0aGlzKSlcblxuICAgIHRoaXMuaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpXG4gICAgdGhpcy5pbnB1dC5zZXRBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScsIHRydWUpXG4gICAgdGhpcy5pbnB1dC5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1pbnB1dC1oZWFkJ1xuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX29uQmx1ckhlYWQuYmluZCh0aGlzKSlcblxuICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1jb250YWluZXInXG5cbiAgICB0aGlzLmNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmNvbnRyb2xzLmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWNvbnRyb2xzJ1xuICAgIHZhciBiMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpXG4gICAgYjEuaW5uZXJIVE1MID0gJzE6MSdcbiAgICBiMS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMucmVzZXRDb250YWluZXIuYmluZCh0aGlzKSlcbiAgICB2YXIgYjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKVxuICAgIGIyLmlubmVySFRNTCA9ICc8aSBjbGFzcz1cImZhIGZhLXRoLWxhcmdlXCIvPidcbiAgICBiMi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMucmVzZXRQb3NpdGlvbnMuYmluZCh0aGlzKSlcbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZENoaWxkKGIxKVxuICAgIHRoaXMuY29udHJvbHMuYXBwZW5kQ2hpbGQoYjIpXG5cbiAgICB0aGlzLmRyb3BTaGFkb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuZHJvcFNoYWRvdy5jbGFzc05hbWUgPSAnd2hpdGVib2FyZC1kcm9wc2hhZG93J1xuXG4gICAgdGhpcy5ib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIpXG4gICAgdGhpcy5ib2R5LmNsYXNzTmFtZSA9ICd3aGl0ZWJvYXJkLWJvZHknXG4gICAgdGhpcy5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5fb25Eb3VibGVDbGljay5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy52bGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy52bGluZS5jbGFzc05hbWU9J3doaXRlYm9hcmRfdmxpbmUnXG4gICAgdGhpcy5obGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5obGluZS5jbGFzc05hbWU9J3doaXRlYm9hcmRfaGxpbmUnXG4gICAgdGhpcy5ib2R5LmFwcGVuZENoaWxkKHRoaXMudmxpbmUpXG4gICAgdGhpcy5ib2R5LmFwcGVuZENoaWxkKHRoaXMuaGxpbmUpXG4gICAgdGhpcy5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZHJvcFNoYWRvdylcbiAgICB0aGlzLmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9scylcblxuICAgIHJvb3ROb2RlLmFwcGVuZENoaWxkKHRoaXMuaGVhZClcbiAgICByb290Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLmJvZHkpXG5cbiAgICB0aGlzLnJvb3ROb2RlID0gcm9vdE5vZGVcbiAgICB0aGlzLnNldENvbnRhaW5lclpvb20oMSlcbiAgICB0aGlzLnNldENvbnRhaW5lclBvcygwLCAwKVxuICB9LFxuXG4gIC8vIENvbnRyb2xsZXIgLyBDb21tYW5kcyBBUEkgc3R1ZmZcblxuICBnZXRBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290XG4gIH0sXG5cbiAgYWRkVHJlZTogZnVuY3Rpb24gKG5vZGUsIGJlZm9yZSkge1xuICAgIGlmIChub2RlLnBhcmVudCAhPT0gdGhpcy5yb290KSByZXR1cm47XG4gICAgdGhpcy5tYWtlQmxvY2sobm9kZS5pZCwgMClcbiAgfSxcblxuICBhZGQ6IGZ1bmN0aW9uIChub2RlLCBiZWZvcmUsIGRvbnRmb2N1cykge1xuICAgIGlmIChub2RlLnBhcmVudCA9PT0gdGhpcy5yb290KSB7XG4gICAgICB2YXIgYmxvY2sgPSB0aGlzLm1ha2VCbG9jayhub2RlLmlkLCAwKVxuICAgICAgYmxvY2subm9kZS5zdHlsZS56SW5kZXggPSBPYmplY3Qua2V5cyh0aGlzLmlkcykubGVuZ3RoXG4gICAgICBpZiAoIWRvbnRmb2N1cykge1xuICAgICAgICBibG9jay5mb2N1cygpXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCF0aGlzLmlkc1tub2RlLnBhcmVudF0pIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmlkc1tub2RlLnBhcmVudF0uYWRkQ2hpbGQobm9kZSwgdGhpcy5tb2RlbClcbiAgfSxcblxuICBzZXRDb2xsYXBzZWQ6IGZ1bmN0aW9uICgpIHtcbiAgfSxcbiAgc3RhcnRFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG4gIHNldEFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICB9LFxuICBzZXRTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgfSxcblxuICBtb3ZlOiBmdW5jdGlvbiAoaWQsIHBpZCwgYmVmb3JlLCBvcGlkLCBsYXN0Y2hpbGQpIHtcbiAgICBpZiAodGhpcy5pZHNbb3BpZF0pIHtcbiAgICAgIHRoaXMuaWRzW29waWRdLnJlbW92ZUNoaWxkKGlkKVxuICAgIH0gZWxzZSBpZiAob3BpZCA9PSB0aGlzLnJvb3QpIHtcbiAgICAgIHRoaXMuaWRzW2lkXS5yZW1vdmUoKVxuICAgICAgZGVsZXRlIHRoaXMuaWRzW2lkXVxuICAgIH1cbiAgICBpZiAodGhpcy5pZHNbcGlkXSkge1xuICAgICAgcmV0dXJuIHRoaXMuaWRzW3BpZF0uYWRkQ2hpbGQodGhpcy5tb2RlbC5pZHNbaWRdLCBpZCwgYmVmb3JlKVxuICAgIH1cbiAgICBpZiAocGlkICE9PSB0aGlzLnJvb3QpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmFkZCh0aGlzLm1vZGVsLmlkc1tpZF0sIGJlZm9yZSlcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgIGNvbnNvbGUud2FybihcIkZJWD8/XCIpXG4gICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5pZHNbaWRdLm5vZGUpXG4gICAgZGVsZXRlIHRoaXMuaWRzW2lkXVxuICB9LFxuICBnb1RvOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS53YXJuKCdGSVghJyk7XG4gIH0sXG4gIGNsZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5pZHMpIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuaWRzW2lkXS5ub2RlKVxuICAgIH1cbiAgICB0aGlzLmlkcyA9IHt9XG4gICAgdGhpcy5zZXRDb250YWluZXJQb3MoMCwgMClcbiAgICB0aGlzLnNldENvbnRhaW5lclpvb20oMSk7XG4gIH0sXG5cbiAgcmViYXNlOiBmdW5jdGlvbiAobmV3cm9vdCwgdHJpZ2dlcikge1xuICAgIHRoaXMuY2xlYXIoKVxuICAgIHRoaXMucm9vdCA9IG5ld3Jvb3RcbiAgICB0aGlzLm1ha2VCbG9ja3MobmV3cm9vdClcbiAgICB0aGlzLmN0cmxhY3Rpb25zLnRyaWdnZXIoJ3JlYmFzZScsIG5ld3Jvb3QpXG4gIH0sXG5cbiAgc2V0QXR0cjogZnVuY3Rpb24gKGlkLCBhdHRyLCB2YWx1ZSkge1xuICAgIGlmICghdGhpcy5pZHNbaWRdKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGF0dHIgPT09ICd3aGl0ZWJvYXJkJykge1xuICAgICAgaWYgKCF2YWx1ZSB8fCAhdmFsdWUudG9wKSB7XG4gICAgICAgIHZhciBjaCA9IHRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY2hpbGRyZW5cbiAgICAgICAgICAsIGkgPSBjaC5pbmRleE9mKGlkKVxuICAgICAgICAgICwgZGVmYXVsdFdpZHRoID0gMzAwXG4gICAgICAgICAgLCBkZWZhdWx0SGVpZ2h0ID0gMTAwXG4gICAgICAgICAgLCBtYXJnaW4gPSAxMFxuICAgICAgICB2YWx1ZSA9IHtcbiAgICAgICAgICB0b3A6IDEwICsgcGFyc2VJbnQoaSAvIDQpICogKGRlZmF1bHRIZWlnaHQgKyBtYXJnaW4pLFxuICAgICAgICAgIGxlZnQ6IDEwICsgKGkgJSA0KSAqIChkZWZhdWx0V2lkdGggKyBtYXJnaW4pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuaWRzW2lkXS51cGRhdGVDb25maWcodmFsdWUpXG4gICAgfVxuICAgIC8vIFRPRE8gc29tZXRoaW5nIHdpdGggZG9uZS1uZXNzP1xuICB9LFxuXG4gIHNldENvbnRlbnQ6IGZ1bmN0aW9uIChpZCwgY29udGVudCkge1xuICAgIGlmICghdGhpcy5pZHNbaWRdKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5pZHNbaWRdLnNldENvbnRlbnQoY29udGVudClcbiAgfSxcblxuICBzZXRSb290Q29udGVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICB0aGlzLmhlYWQuaW5uZXJIVE1MID0gbWFya2VkKGNvbnRlbnQpO1xuICB9LFxuXG4gIG1ha2VCbG9ja3M6IGZ1bmN0aW9uIChyb290KSB7XG4gICAgdGhpcy5zZXRSb290Q29udGVudCh0aGlzLm1vZGVsLmlkc1tyb290XS5jb250ZW50KTtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLm1vZGVsLmlkc1tyb290XS5jaGlsZHJlblxuICAgIGlmICghY2hpbGRyZW4pIHJldHVyblxuICAgIGNoaWxkcmVuLmZvckVhY2godGhpcy5tYWtlQmxvY2suYmluZCh0aGlzKSk7XG4gIH0sXG5cbiAgbWFrZUJsb2NrOiBmdW5jdGlvbiAoaWQsIGkpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuaWRzW2lkXVxuICAgICAgLCBjb25maWcgPSBub2RlLm1ldGEud2hpdGVib2FyZFxuICAgICAgLy8gVE9ETzogbWFnaWMgbnVtYmVycz9cbiAgICAgICwgZGVmYXVsdFdpZHRoID0gMzAwXG4gICAgICAsIGRlZmF1bHRIZWlnaHQgPSAxMDBcbiAgICAgICwgbWFyZ2luID0gMTBcbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICAvLyB3aWR0aDogMjAwLFxuICAgICAgICAvLyBoZWlnaHQ6IDIwMCxcbiAgICAgICAgdG9wOiAxMCArIHBhcnNlSW50KGkgLyA0KSAqIChkZWZhdWx0SGVpZ2h0ICsgbWFyZ2luKSxcbiAgICAgICAgbGVmdDogMTAgKyAoaSAlIDQpICogKGRlZmF1bHRXaWR0aCArIG1hcmdpbilcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gKG5vZGUuY2hpbGRyZW4gfHwgW10pLm1hcChmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLmlkc1tpZF1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayhub2RlLCBjaGlsZHJlbiwgY29uZmlnLCB7XG4gICAgICBzYXZlQ29uZmlnOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIHRoaXMuY3RybGFjdGlvbnMuY2hhbmdlZChub2RlLmlkLCAnd2hpdGVib2FyZCcsIGNvbmZpZylcbiAgICAgICAgLy8gdGhpcy5jdHJsLmV4ZWN1dGVDb21tYW5kcygnY2hhbmdlTm9kZUF0dHInLCBbbm9kZS5pZCwgJ3doaXRlYm9hcmQnLCBjb25maWddKTtcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIHNhdmVDb250ZW50OiBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICB0aGlzLmN0cmxhY3Rpb25zLmNoYW5nZUNvbnRlbnQobm9kZS5pZCwgY29udGVudClcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIGNoYW5nZUNvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICAgIHRoaXMuY3RybGFjdGlvbnMuY2hhbmdlQ29udGVudChub2RlLmlkLCBjb250ZW50KVxuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgc3RhcnRNb3Zpbmc6IHRoaXMuX29uU3RhcnRNb3ZpbmcuYmluZCh0aGlzLCBub2RlLmlkKSxcbiAgICAgIHN0YXJ0TW92aW5nQ2hpbGQ6IHRoaXMuX29uU3RhcnRNb3ZpbmdDaGlsZC5iaW5kKHRoaXMsIG5vZGUuaWQpLFxuICAgICAgb25ab29tOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmViYXNlKG5vZGUuaWQpXG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgfSlcbiAgICB0aGlzLmlkc1tpZF0gPSBibG9ja1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGJsb2NrLm5vZGUpXG4gICAgcmV0dXJuIGJsb2NrXG4gIH0sXG5cbiAgLyoqXG4gICAqIElmIHRoZSBjdXJyZW50IGlzIG92ZXIgYSB0YXJnZXQsIHNob3cgdGhlIGRyb3Agc2hhZG93LlxuICAgKi9cbiAgdXBkYXRlRHJvcFRhcmdldDogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgdFxuICAgIC8qXG4gICAgaWYgKHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHQgPSB0aGlzLm1vdmluZy5jdXJyZW50VGFyZ2V0XG4gICAgICBpZiAoeCA+PSB0LmhpdC5sZWZ0ICYmIHggPD0gdC5oaXQucmlnaHQgJiZcbiAgICAgICAgICB5ID49IHQuaGl0LnRvcCAmJiB5IDw9IHQuaGl0LmJvdHRvbSkge1xuICAgICAgICAvLyBqdXN0IGtlZXAgdGhlIGN1cnJlbnQgb25lXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cbiAgICAqL1xuICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLm1vdmluZy50YXJnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ID0gdGhpcy5tb3ZpbmcudGFyZ2V0c1tpXVxuICAgICAgaWYgKHggPj0gdC5oaXQubGVmdCAmJiB4IDw9IHQuaGl0LnJpZ2h0ICYmXG4gICAgICAgICAgeSA+PSB0LmhpdC50b3AgJiYgeSA8PSB0LmhpdC5ib3R0b20pIHtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldCA9IHRcbiAgICAgICAgdGhpcy5zaG93RHJvcFNoYWRvdyh0LmRyYXcpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQgPSBudWxsXG4gICAgdGhpcy5oaWRlRHJvcFNoYWRvdygpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbGxlY3QgYSBsaXN0IG9mIHRhcmdldHMgXG4gICAqL1xuICBmaW5kVGFyZ2V0czogZnVuY3Rpb24gKGNoaWxkcmVuLCBpZCwgaXNDaGlsZCkge1xuICAgIHZhciB0YXJnZXRzID0gW11cbiAgICAgICwgc25hcHMgPSBbXVxuICAgICAgLCByb290ID0gdGhpcy5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgZm9yICh2YXIgaSA9IGNoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoaWQgPT0gY2hpbGRyZW5baV0pIGNvbnRpbnVlO1xuICAgICAgdmFyIGNoaWxkaWRzID0gdGhpcy5tb2RlbC5pZHNbY2hpbGRyZW5baV1dLmNoaWxkcmVuXG4gICAgICAgICwgY2hpbGQgPSB0aGlzLmlkc1tjaGlsZHJlbltpXV1cbiAgICAgICAgLCB3aG9sZSA9IGNoaWxkLndob2xlVGFyZ2V0KGlkLCBjaGlsZGlkcy5sZW5ndGgpXG4gICAgICB0YXJnZXRzID0gdGFyZ2V0cy5jb25jYXQoY2hpbGQuZ2V0Q2hpbGRUYXJnZXRzKGlkLCBjaGlsZHJlbltpXSwgY2hpbGRpZHMpKVxuICAgICAgdGFyZ2V0cy5wdXNoKHdob2xlKVxuICAgICAgaWYgKCFpc0NoaWxkKSB7XG4gICAgICAgIHNuYXBzLnB1c2goe1xuICAgICAgICAgIHRvcDogd2hvbGUuaGl0LnRvcCAtIHJvb3QudG9wLFxuICAgICAgICAgIGxlZnQ6IHdob2xlLmhpdC5sZWZ0IC0gcm9vdC5sZWZ0LFxuICAgICAgICAgIHJpZ2h0OiB3aG9sZS5oaXQucmlnaHQgLSByb290LmxlZnQsXG4gICAgICAgICAgYm90dG9tOiB3aG9sZS5oaXQuYm90dG9tIC0gcm9vdC50b3BcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhcmdldHM6IHRhcmdldHMsXG4gICAgICBzbmFwczogc25hcHNcbiAgICB9XG4gIH0sXG5cbiAgdHJ5U25hcDogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAvLyBjb252ZXJ0IHRvIHNjcmVlbiBjb29yZHNcbiAgICB4ID0geCAqIHRoaXMuX3pvb20gKyB0aGlzLnhcbiAgICB5ID0geSAqIHRoaXMuX3pvb20gKyB0aGlzLnlcbiAgICB2YXIgaCA9IHRoaXMubW92aW5nLmhlaWdodFxuICAgICAgLCB3ID0gdGhpcy5tb3Zpbmcud2lkdGhcbiAgICAgICwgYiA9IHkgKyBoXG4gICAgICAsIHIgPSB4ICsgd1xuICAgICAgLCBhbGxvd2FuY2UgPSAyMCAqIHRoaXMuX3pvb21cbiAgICAgICwgc3BhY2UgPSAxMCAqIHRoaXMuX3pvb21cblxuICAgIGlmIChhbGxvd2FuY2UgPCAyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBzaG93IGd1aWRpbmcgbGluZXNcbiAgICB2YXIgbGluZXMgPSBbXVxuICAgICAgLCBkeCA9IGZhbHNlXG4gICAgICAsIGR5ID0gZmFsc2VcblxuICAgIHRoaXMubW92aW5nLnNuYXBzLmZvckVhY2goZnVuY3Rpb24gKHNuYXApIHtcbiAgICAgIGlmICghZHkpIHtcbiAgICAgICAgLy8gdG9wXG4gICAgICAgIGlmIChNYXRoLmFicyhzbmFwLnRvcCAtIHNwYWNlIC0gYikgPCBhbGxvd2FuY2UpIHtcbiAgICAgICAgICB5ID0gc25hcC50b3AgLSBzcGFjZSAtIGhcbiAgICAgICAgICBkeSA9IFtzbmFwLmxlZnQsIHNuYXAucmlnaHQsIHNuYXAudG9wIC0gc3BhY2UgLyAyXVxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKHNuYXAudG9wIC0geSkgPCBhbGxvd2FuY2UpIHtcbiAgICAgICAgICB5ID0gc25hcC50b3BcbiAgICAgICAgICBkeSA9IFtzbmFwLmxlZnQsIHNuYXAucmlnaHQsIHNuYXAudG9wIC0gc3BhY2UgLyAyXVxuICAgICAgICB9IGVsc2UgaWYgKE1hdGguYWJzKHNuYXAuYm90dG9tICsgc3BhY2UgLSB5KSA8IGFsbG93YW5jZSkgeyAvLyBib3R0b21cbiAgICAgICAgICB5ID0gc25hcC5ib3R0b20gKyBzcGFjZVxuICAgICAgICAgIGR5ID0gW3NuYXAubGVmdCwgc25hcC5yaWdodCwgc25hcC5ib3R0b20gKyBzcGFjZSAvIDJdXG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoc25hcC5ib3R0b20gLSBiKSA8IGFsbG93YW5jZSkge1xuICAgICAgICAgIHkgPSBzbmFwLmJvdHRvbSAtIGhcbiAgICAgICAgICBkeSA9IFtzbmFwLmxlZnQsIHNuYXAucmlnaHQsIHNuYXAuYm90dG9tICsgc3BhY2UgLyAyXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZHgpIHtcbiAgICAgICAgLy8gbGVmdFxuICAgICAgICBpZiAoTWF0aC5hYnMoc25hcC5sZWZ0IC0gc3BhY2UgLSByKSA8IGFsbG93YW5jZSkge1xuICAgICAgICAgIHggPSBzbmFwLmxlZnQgLSBzcGFjZSAtIHdcbiAgICAgICAgICBkeCA9IFtzbmFwLnRvcCwgc25hcC5ib3R0b20sIHNuYXAubGVmdCAtIHNwYWNlIC8gMl1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhzbmFwLmxlZnQgLSB4KSA8IGFsbG93YW5jZSkge1xuICAgICAgICAgIHggPSBzbmFwLmxlZnRcbiAgICAgICAgICBkeCA9IFtzbmFwLnRvcCwgc25hcC5ib3R0b20sIHNuYXAubGVmdCAtIHNwYWNlIC8gMl1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhzbmFwLnJpZ2h0ICsgc3BhY2UgLSB4KSA8IGFsbG93YW5jZSkgeyAvLyByaWdodFxuICAgICAgICAgIHggPSBzbmFwLnJpZ2h0ICsgc3BhY2VcbiAgICAgICAgICBkeCA9IFtzbmFwLnRvcCwgc25hcC5ib3R0b20sIHNuYXAucmlnaHQgKyBzcGFjZSAvIDJdXG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoc25hcC5yaWdodCAtIHIpIDwgYWxsb3dhbmNlKSB7XG4gICAgICAgICAgeCA9IHNuYXAucmlnaHQgLSB3XG4gICAgICAgICAgZHggPSBbc25hcC50b3AsIHNuYXAuYm90dG9tLCBzbmFwLnJpZ2h0ICsgc3BhY2UgLyAyXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmIChkeCkge1xuICAgICAgdmFyIGh0ID0gTWF0aC5taW4oZHhbMF0sIHkpXG4gICAgICAgICwgaGIgPSBNYXRoLm1heChkeFsxXSwgeSArIGgpXG4gICAgICB0aGlzLnZsaW5lLnN0eWxlLmxlZnQgPSBkeFsyXSAtIDEgKyAncHgnXG4gICAgICB0aGlzLnZsaW5lLnN0eWxlLnRvcCA9IGh0IC0gc3BhY2UvMiArICdweCdcbiAgICAgIHRoaXMudmxpbmUuc3R5bGUuaGVpZ2h0ID0gKGhiIC0gaHQpICsgc3BhY2UgKyAncHgnXG4gICAgICB0aGlzLnZsaW5lLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudmxpbmUuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH1cblxuICAgIGlmIChkeSkge1xuICAgICAgdmFyIHZsID0gTWF0aC5taW4oZHlbMF0sIHgpXG4gICAgICAgICwgdnIgPSBNYXRoLm1heChkeVsxXSwgeCArIHcpXG4gICAgICB0aGlzLmhsaW5lLnN0eWxlLnRvcCA9IGR5WzJdIC0gMSArICdweCdcbiAgICAgIHRoaXMuaGxpbmUuc3R5bGUubGVmdCA9IHZsIC0gc3BhY2UvMiArICdweCdcbiAgICAgIHRoaXMuaGxpbmUuc3R5bGUud2lkdGggPSAodnIgLSB2bCkgKyBzcGFjZSArICdweCdcbiAgICAgIHRoaXMuaGxpbmUuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5obGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgfVxuXG4gICAgaWYgKGR4IHx8IGR5KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiAoeCAtIHRoaXMueCkvdGhpcy5fem9vbSxcbiAgICAgICAgeTogKHkgLSB0aGlzLnkpL3RoaXMuX3pvb21cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgZ2V0QnlaSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmlkcykge1xuICAgICAgaXRlbXMucHVzaChbK3RoaXMuaWRzW2lkXS5ub2RlLnN0eWxlLnpJbmRleCwgaWRdKVxuICAgIH1cbiAgICBpdGVtcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICByZXR1cm4gYVswXSAtIGJbMF1cbiAgICB9KVxuICAgIHJldHVybiBpdGVtcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtyZXR1cm4gaXRlbVsxXX0pXG4gIH0sXG5cbiAgc2h1ZmZsZVpJbmRpY2VzOiBmdW5jdGlvbiAodG9wKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5nZXRCeVpJbmRleCgpXG4gICAgZm9yICh2YXIgaT0wOyBpPGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmlkc1tpdGVtc1tpXV0ubm9kZS5zdHlsZS56SW5kZXggPSBpXG4gICAgfVxuICAgIHRoaXMuaWRzW3RvcF0ubm9kZS5zdHlsZS56SW5kZXggPSBpdGVtcy5sZW5ndGhcbiAgICByZXR1cm4gaXRlbXNcbiAgfSxcblxuICAvLyBldmVudCBoYW5kbGVyc1xuXG4gIF9vbkNsaWNrSGVhZDogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB0aGlzLnN0YXJ0RWRpdGluZygpXG4gIH0sXG5cbiAgX29uQmx1ckhlYWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5zdG9wRWRpdGluZygpXG4gIH0sXG5cbiAgc3RhcnRFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pbnB1dC52YWx1ZSA9IHRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY29udGVudFxuICAgIHRoaXMucm9vdE5vZGUucmVwbGFjZUNoaWxkKHRoaXMuaW5wdXQsIHRoaXMuaGVhZClcbiAgICB0aGlzLmlucHV0LmZvY3VzKClcbiAgICB0aGlzLmlucHV0LnNlbGVjdGlvblN0YXJ0ID0gdGhpcy5pbnB1dC5zZWxlY3Rpb25FbmQgPSB0aGlzLmlucHV0LnZhbHVlLmxlbmd0aFxuICB9LFxuXG4gIHN0b3BFZGl0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jdHJsYWN0aW9ucy5jaGFuZ2VDb250ZW50KHRoaXMucm9vdCwgdGhpcy5pbnB1dC52YWx1ZSlcbiAgICB0aGlzLnNldFJvb3RDb250ZW50KHRoaXMuaW5wdXQudmFsdWUpXG4gICAgdGhpcy5yb290Tm9kZS5yZXBsYWNlQ2hpbGQodGhpcy5oZWFkLCB0aGlzLmlucHV0KVxuICB9LFxuXG4gIF9vbkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldCA9PT0gdGhpcy5yb290Tm9kZSkge1xuICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKClcbiAgICB9XG4gIH0sXG5cbiAgX29uRG91YmxlQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUudGFyZ2V0ICE9PSB0aGlzLmJvZHkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB2YXIgeCA9IGUuY2xpZW50WCAtIDUwIC0gYm94LmxlZnRcbiAgICAgICwgeSA9IGUuY2xpZW50WSAtIDEwIC0gYm94LnRvcFxuICAgICAgLCBpZHggPSB0aGlzLm1vZGVsLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuLmxlbmd0aFxuICAgIHRoaXMuY3RybGFjdGlvbnMuYWRkQ2hpbGQodGhpcy5yb290LCBpZHgsICcnLCB7XG4gICAgICB3aGl0ZWJvYXJkOiB7XG4gICAgICAgIC8vIHdpZHRoOiAyMDAsXG4gICAgICAgIC8vIGhlaWdodDogMjAwLFxuICAgICAgICB0b3A6IHksXG4gICAgICAgIGxlZnQ6IHhcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIF9vbldoZWVsOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGlmICh0aGlzLm1vdmluZykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciB4LCB5XG4gICAgdmFyIGRlbHRhWCA9IC1lLmRlbHRhWCwgZGVsdGFZID0gLWUuZGVsdGFZXG4gICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgIHZhciByb290ID0gdGhpcy5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICB4ID0gZS5jbGllbnRYIC0gcm9vdC5sZWZ0XG4gICAgICB5ID0gZS5jbGllbnRZIC0gcm9vdC50b3BcbiAgICAgIHRoaXMuem9vbU1vdmUoKGRlbHRhWSAvIDUwMCksIHgsIHkpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgeCA9IHRoaXMueFxuICAgIHkgPSB0aGlzLnlcbiAgICB0aGlzLnNldENvbnRhaW5lclBvcyh4ICsgZGVsdGFYLCB5ICsgZGVsdGFZKVxuICB9LFxuXG4gIF9vbk1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS50YXJnZXQgIT09IHRoaXMucm9vdE5vZGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB2YXIgeCA9IGUuY2xpZW50WCAtIGJveC5sZWZ0XG4gICAgICAsIHkgPSBlLmNsaWVudFkgLSBib3gudG9wXG4gICAgdGhpcy5tb3ZpbmcgPSB7XG4gICAgICB4OiB4LFxuICAgICAgeTogeSxcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fYm91bmRNb3ZlKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLl9ib3VuZFVwKVxuICB9LFxuXG4gIF9vblN0YXJ0TW92aW5nOiBmdW5jdGlvbiAoaWQsIGUsIHJlY3QsIHNoaWZ0TW92ZSkge1xuICAgIGlmICh0aGlzLm1vdmluZykgcmV0dXJuIGZhbHNlO1xuICAgIHZhciB5ID0gZS5jbGllbnRZIC8gdGhpcy5fem9vbSAtIHJlY3QudG9wL3RoaXMuX3pvb21cbiAgICAgICwgeCA9IGUuY2xpZW50WCAvIHRoaXMuX3pvb20gLSByZWN0LmxlZnQvdGhpcy5fem9vbVxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuc2h1ZmZsZVpJbmRpY2VzKGlkKVxuICAgIHZhciBib3hlcyA9IHRoaXMuZmluZFRhcmdldHMoY2hpbGRyZW4sIGlkKVxuICAgIHRoaXMubW92aW5nID0ge1xuICAgICAgc2hpZnQ6IHNoaWZ0TW92ZSxcbiAgICAgIHRhcmdldHM6IGJveGVzLnRhcmdldHMsXG4gICAgICBzbmFwczogYm94ZXMuc25hcHMsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgICBhdHg6IHRoaXMuaWRzW2lkXS54LFxuICAgICAgYXR5OiB0aGlzLmlkc1tpZF0ueSxcbiAgICAgIGlkOiBpZCxcbiAgICAgIHg6IHgsXG4gICAgICB5OiB5LFxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgX29uU3RhcnRNb3ZpbmdDaGlsZDogZnVuY3Rpb24gKGlkLCBlLCBjaWQsIGhhbmRsZSwgc2hpZnRNb3ZlKSB7XG4gICAgaWYgKHRoaXMubW92aW5nKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGJveCA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdmFyIHggPSBlLmNsaWVudFgvdGhpcy5fem9vbSAtIGJveC5sZWZ0L3RoaXMuX3pvb21cbiAgICAgICwgeSA9IGUuY2xpZW50WS90aGlzLl96b29tIC0gYm94LnRvcC90aGlzLl96b29tXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5nZXRCeVpJbmRleCgpXG4gICAgdmFyIGJveGVzID0gdGhpcy5maW5kVGFyZ2V0cyhjaGlsZHJlbiwgY2lkLCB0cnVlKVxuICAgIHRoaXMubW92aW5nID0ge1xuICAgICAgc2hpZnQ6IHNoaWZ0TW92ZSxcbiAgICAgIHRhcmdldHM6IGJveGVzLnRhcmdldHMsXG4gICAgICBzbmFwczogYm94ZXMuc25hcHMsXG4gICAgICBoYW5kbGU6IGhhbmRsZSxcbiAgICAgIGNoaWxkOiBjaWQsXG4gICAgICBwYXJlbnRfaWQ6IGlkLFxuICAgICAgb3R5OiB4LFxuICAgICAgb3R4OiB5LFxuICAgICAgeDogeCxcbiAgICAgIHk6IHlcbiAgICB9XG4gICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoaGFuZGxlKVxuICAgIHRoaXMudXBkYXRlRHJvcFRhcmdldChlLmNsaWVudFgsIGUuY2xpZW50WSlcbiAgICBoYW5kbGUuY2xhc3NOYW1lID0gJ3doaXRlYm9hcmRfY2hpbGQtaGFuZGxlJ1xuICAgIGhhbmRsZS5zdHlsZS50b3AgPSB5ICsgJ3B4J1xuICAgIGhhbmRsZS5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QuYWRkKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgX29uS2V5VXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMTYgJiYgdGhpcy5tb3ZpbmcgJiYgdGhpcy5tb3Zpbmcuc2hpZnQpIHtcbiAgICAgIHRoaXMuc3RvcE1vdmluZygpXG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIXRoaXMubW92aW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb25Nb3VzZVVwKGUpXG4gICAgfVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKHRoaXMubW92aW5nLmNoaWxkKSB7XG4gICAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIHZhciB4ID0gZS5jbGllbnRYL3RoaXMuX3pvb20gLSBib3gubGVmdC90aGlzLl96b29tXG4gICAgICAgICwgeSA9IGUuY2xpZW50WS90aGlzLl96b29tIC0gYm94LnRvcC90aGlzLl96b29tXG4gICAgICB0aGlzLm1vdmluZy5oYW5kbGUuc3R5bGUudG9wID0geSArICdweCdcbiAgICAgIHRoaXMubW92aW5nLmhhbmRsZS5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICAgIHRoaXMubW92aW5nLnggPSB4XG4gICAgICB0aGlzLm1vdmluZy55ID0geVxuICAgICAgdGhpcy51cGRhdGVEcm9wVGFyZ2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW92aW5nLmlkKSB7XG4gICAgICB2YXIgYm94ID0gdGhpcy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIHZhciB4ID0gZS5jbGllbnRYL3RoaXMuX3pvb20gLSBib3gubGVmdC90aGlzLl96b29tIC0gdGhpcy5tb3ZpbmcueFxuICAgICAgICAsIHkgPSBlLmNsaWVudFkvdGhpcy5fem9vbSAtIGJveC50b3AvdGhpcy5fem9vbSAtIHRoaXMubW92aW5nLnlcbiAgICAgIGlmICghdGhpcy51cGRhdGVEcm9wVGFyZ2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xuICAgICAgICAvLyBubyBkcm9wIHBsYWNlIHdhcyBmb3VuZCwgbGV0J3Mgc25hcCFcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMudHJ5U25hcCh4LCB5KVxuICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgeCA9IHBvcy54XG4gICAgICAgICAgeSA9IHBvcy55XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubW92aW5nLmF0eCA9IHhcbiAgICAgIHRoaXMubW92aW5nLmF0eSA9IHlcbiAgICAgIHRoaXMuaWRzW3RoaXMubW92aW5nLmlkXS5yZXBvc2l0aW9uKHgsIHksIHRydWUpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IFxuXG4gICAgLy8gZHJhZ2dpbmcgdGhlIGNhbnZhc1xuICAgIHZhciBib3ggPSB0aGlzLmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB2YXIgeCA9IGUuY2xpZW50WCAtIGJveC5sZWZ0IC0gdGhpcy5tb3ZpbmcueFxuICAgICAgLCB5ID0gZS5jbGllbnRZIC0gYm94LnRvcCAtIHRoaXMubW92aW5nLnlcbiAgICB0aGlzLnNldENvbnRhaW5lclBvcyh4LCB5KVxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIF9vbk1vdXNlVXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5zdG9wTW92aW5nKClcbiAgICByZXR1cm4gZmFsc2VcbiAgfSxcblxuICByZXNldENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0Q29udGFpbmVyUG9zKDAsIDApXG4gICAgdGhpcy5zZXRDb250YWluZXJab29tKDEpXG4gIH0sXG5cbiAgcmVzZXRQb3NpdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY21kcyA9IFtdXG4gICAgdGhpcy5tb2RlbC5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgY21kcy5wdXNoKCdjaGFuZ2VOb2RlQXR0cicpXG4gICAgICBjbWRzLnB1c2goW2lkLCAnd2hpdGVib2FyZCcsIG51bGxdKVxuICAgIH0pO1xuICAgIHRoaXMuY3RybGFjdGlvbnMuY29tbWFuZHMoY21kcylcbiAgfSxcblxuICB6b29tTW92ZTogZnVuY3Rpb24gKGRlbHRhLCB4LCB5KSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLl96b29tICogZGVsdGFcbiAgICAgICwgbnogPSB0aGlzLl96b29tICsgbmV4dFxuICAgICAgLCBzY2FsZSA9IHRoaXMuX3pvb20gLyBuelxuICAgICAgLCBueCA9IHggLSB4IC8gc2NhbGVcbiAgICAgICwgbnkgPSB5IC0geSAvIHNjYWxlXG4gICAgdGhpcy5zZXRDb250YWluZXJQb3ModGhpcy54L3NjYWxlICsgbngsIHRoaXMueS9zY2FsZSArIG55KVxuICAgIHRoaXMuc2V0Q29udGFpbmVyWm9vbShueilcbiAgfSxcblxuICBzZXRDb250YWluZXJab29tOiBmdW5jdGlvbiAobnVtKSB7XG4gICAgdGhpcy5fem9vbSA9IG51bVxuICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLldlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgnICsgbnVtICsgJyknXG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKCcgKyBudW0gKyAnKSdcbiAgfSxcblxuICBzZXRDb250YWluZXJQb3M6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdGhpcy54ID0geFxuICAgIHRoaXMueSA9IHlcbiAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS5sZWZ0ID0geCArICdweCdcbiAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS50b3AgPSB5ICsgJ3B4J1xuICB9LFxuXG4gIC8vIG90aGVyIHN0dWZmXG5cbiAgc3RvcE1vdmluZ0NoaWxkOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETyBtb3ZlIGludG9cbiAgICB0aGlzLm1vdmluZy5oYW5kbGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm1vdmluZy5oYW5kbGUpXG4gICAgdmFyIHBvcyA9IHRoaXMubW9kZWwuaWRzW3RoaXMucm9vdF0uY2hpbGRyZW4ubGVuZ3RoXG5cbiAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldCkge1xuICAgICAgdmFyIHBvcyA9IHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQucG9zXG4gICAgICBpZiAodGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldC5waWQgPT0gdGhpcy5tb3ZpbmcucGFyZW50X2lkKSB7XG4gICAgICAgIGlmIChwb3MgPiB0aGlzLm1vZGVsLmlkc1t0aGlzLm1vdmluZy5wYXJlbnRfaWRdLmNoaWxkcmVuLmluZGV4T2YodGhpcy5tb3ZpbmcuY2hpbGQpKSB7XG4gICAgICAgICAgcG9zIC09IDFcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5jdHJsYWN0aW9ucy5jb21tYW5kcygnbW92ZScsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgIHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQucGlkLFxuICAgICAgICBwb3NcbiAgICAgIF0sICdjaGFuZ2VOb2RlQXR0cicsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgbnVsbFxuICAgICAgXSk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgdGhpcy5jdHJsYWN0aW9ucy5jb21tYW5kcygnY2hhbmdlTm9kZUF0dHInLCBbXG4gICAgICAgIHRoaXMubW92aW5nLmNoaWxkLFxuICAgICAgICAnd2hpdGVib2FyZCcsXG4gICAgICAgIHt0b3A6IHRoaXMubW92aW5nLnksIGxlZnQ6IHRoaXMubW92aW5nLnh9XG4gICAgICBdLCAnbW92ZScsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuY2hpbGQsXG4gICAgICAgIHRoaXMucm9vdCxcbiAgICAgICAgcG9zXG4gICAgICBdKVxuXG4gICAgfVxuXG4gICAgdGhpcy5pZHNbdGhpcy5tb3ZpbmcucGFyZW50X2lkXS5kb25lTW92aW5nKClcbiAgfSxcblxuICBzaG93RHJvcFNoYWRvdzogZnVuY3Rpb24gKHJlY3QpIHtcbiAgICB2YXIgYm94ID0gdGhpcy5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAsIHJlYWxoZWlnaHQgPSByZWN0LmhlaWdodCAqIHRoaXMuX3pvb21cbiAgICAgICwgeW9mZiA9IChyZWN0LmhlaWdodCAtIHJlYWxoZWlnaHQpIC8gMlxuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS50b3AgPSByZWN0LnRvcCAtIGJveC50b3AgKyB5b2ZmICsgJ3B4J1xuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS5sZWZ0ID0gcmVjdC5sZWZ0IC0gYm94LmxlZnQgKyAncHgnXG4gICAgdGhpcy5kcm9wU2hhZG93LnN0eWxlLndpZHRoID0gcmVjdC53aWR0aCArICdweCdcbiAgICB0aGlzLmRyb3BTaGFkb3cuc3R5bGUuaGVpZ2h0ID0gcmVhbGhlaWdodCArICdweCdcbiAgICB0aGlzLmRyb3BTaGFkb3cuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgfSxcblxuICBoaWRlRHJvcFNoYWRvdzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZHJvcFNoYWRvdy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gIH0sXG5cbiAgc3RvcE1vdmluZ01haW46IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlkc1t0aGlzLm1vdmluZy5pZF0ucmVwb3NpdGlvbih0aGlzLm1vdmluZy5hdHgsIHRoaXMubW92aW5nLmF0eSlcbiAgICB0aGlzLmlkc1t0aGlzLm1vdmluZy5pZF0uZG9uZU1vdmluZygpXG4gICAgaWYgKHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHRoaXMuY3RybGFjdGlvbnMuY29tbWFuZHMoJ21vdmUnLCBbXG4gICAgICAgIHRoaXMubW92aW5nLmlkLFxuICAgICAgICB0aGlzLm1vdmluZy5jdXJyZW50VGFyZ2V0LnBpZCxcbiAgICAgICAgdGhpcy5tb3ZpbmcuY3VycmVudFRhcmdldC5wb3NcbiAgICAgIF0sICdjaGFuZ2VOb2RlQXR0cicsIFtcbiAgICAgICAgdGhpcy5tb3ZpbmcuaWQsXG4gICAgICAgICd3aGl0ZWJvYXJkJyxcbiAgICAgICAgbnVsbFxuICAgICAgXSk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3BNb3Zpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5tb3ZpbmcuY2hpbGQpIHtcbiAgICAgIHRoaXMuc3RvcE1vdmluZ0NoaWxkKClcbiAgICB9IGVsc2UgaWYgKHRoaXMubW92aW5nLmlkKSB7XG4gICAgICB0aGlzLnN0b3BNb3ZpbmdNYWluKClcbiAgICB9XG4gICAgaWYgKHRoaXMubW92aW5nLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHRoaXMuaGlkZURyb3BTaGFkb3coKVxuICAgIH1cbiAgICB0aGlzLm1vdmluZyA9IG51bGxcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9ib3VuZE1vdmUpXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2JvdW5kVXApXG4gICAgdGhpcy52bGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgdGhpcy5obGluZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgdGhpcy5yb290Tm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd3aGl0ZWJvYXJkLS1tb3ZpbmcnKVxuICB9LFxuXG4gIGdldE5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290Tm9kZVxuICB9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZFRhZzoge1xuICAgIGFyZ3M6IFsnbmFtZSddLFxuICAgIGFwcGx5OiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIGlmICghbW9kZWwuaGFzVGFnUm9vdCgpKSB7XG4gICAgICAgIHZhciBjciA9IG1vZGVsLmFkZFRhZ1Jvb3QoKVxuICAgICAgICB0aGlzLnRhZ1Jvb3QgPSB2aWV3LmFkZChjci5ub2RlLCBjci5iZWZvcmUsIHRydWUpXG4gICAgICB9XG4gICAgICB2YXIgbnIgPSBtb2RlbC5hZGRUYWcodGhpcy5uYW1lKVxuICAgICAgdmlldy5hZGQobnIubm9kZSwgbnIuYmVmb3JlLCB0cnVlKVxuICAgICAgdGhpcy5ub2RlID0gbnIubm9kZVxuICAgICAgcmV0dXJuIHRoaXMubm9kZVxuICAgIH0sXG4gICAgdW5kbzogZnVuY3Rpb24gKHZpZXcsIG1vZGVsKSB7XG4gICAgICBtb2RlbC5yZW1vdmUodGhpcy5ub2RlLmlkKVxuICAgICAgaWYgKHRoaXMudGFnUm9vdCkge1xuICAgICAgICBtb2RlbC5yZW1vdmVUYWdSb290KClcbiAgICAgICAgdmlldy5yZW1vdmUodGhpcy50YWdSb290Lm5vZGUuaWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBzZXRUYWdzOiB7XG4gICAgYXJnczogWydpZCcsICd0YWdzJ10sXG4gICAgYXBwbHk6IGZ1bmN0aW9uICh2aWV3LCBtb2RlbCkge1xuICAgICAgdGhpcy5vbGRUYWdzID0gbW9kZWwuc2V0VGFncyh0aGlzLmlkLCB0aGlzLnRhZ3MpXG4gICAgICB2aWV3LnNldFRhZ3ModGhpcy5pZCwgdGhpcy50YWdzLCB0aGlzLm9sZFRhZ3MpXG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbiAodmlldywgbW9kZWwpIHtcbiAgICAgIG1vZGVsLnNldFRhZ3ModGhpcy5pZCwgdGhpcy5vbGRUYWdzKVxuICAgICAgdmlldy5zZXRUYWdzKHRoaXMuaWQsIHRoaXMub2xkVGFncywgdGhpcy50YWdzKVxuICAgIH0sXG4gIH0sXG59XG5cbiIsIlxudmFyIENvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi8uLi9saWIvY29udHJvbGxlcicpXG4gICwgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL2xpYi91dGlsJylcblxuICAsIFdGTm9kZSA9IHJlcXVpcmUoJy4vbm9kZScpXG4gICwgV0ZWaWV3ID0gcmVxdWlyZSgnLi92aWV3JylcbiAgLCBXRlZMID0gcmVxdWlyZSgnLi92bCcpXG4gICwgY29tbWFuZHMgPSByZXF1aXJlKCcuL2NvbW1hbmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBXRkNvbnRyb2xsZXJcblxuZnVuY3Rpb24gV0ZDb250cm9sbGVyKG1vZGVsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMuZXh0cmFfY29tbWFuZHMgPSB1dGlsLmV4dGVuZChvcHRpb25zLmV4dHJhX2NvbW1hbmRzIHx8IHt9LCBjb21tYW5kcylcbiAgQ29udHJvbGxlci5jYWxsKHRoaXMsIG1vZGVsLCBvcHRpb25zKVxuICB0aGlzLm9uKCdyZWJhc2UnLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHRoaXMudHJpZ2dlcignYnVsbGV0JywgdGhpcy5tb2RlbC5nZXRMaW5lYWdlKGlkKSlcbiAgfS5iaW5kKHRoaXMpKVxufVxuXG5XRkNvbnRyb2xsZXIucHJvdG90eXBlID0gdXRpbC5leHRlbmQoT2JqZWN0LmNyZWF0ZShDb250cm9sbGVyLnByb3RvdHlwZSksIHtcbiAgcmVmcmVzaEJ1bGxldDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudHJpZ2dlcignYnVsbGV0JywgdGhpcy5tb2RlbC5nZXRMaW5lYWdlKHRoaXMubW9kZWwucm9vdCkpXG4gIH1cbn0pXG5cbldGQ29udHJvbGxlci5wcm90b3R5cGUuYWN0aW9ucyA9IHV0aWwuZXh0ZW5kKHtcbiAgY2xpY2tCdWxsZXQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIGlmIChpZCA9PT0gJ25ldycpIHJldHVyblxuICAgIHRoaXMudmlldy5yZWJhc2UoaWQpXG4gICAgLy8gdGhpcy50cmlnZ2VyKCdidWxsZXQnLCB0aGlzLm1vZGVsLmdldExpbmVhZ2UoaWQpKVxuICB9LFxuICByZWJhc2U6IGZ1bmN0aW9uIChpZCwgdG9pZCkge1xuICAgIHRoaXMudmlldy5yZWJhc2UodG9pZClcbiAgfSxcbiAgYmFja0FMZXZlbDogZnVuY3Rpb24gKCkge1xuICAgIHZhciByb290ID0gdGhpcy52aWV3LnJvb3RcbiAgICAgICwgcGlkID0gdGhpcy5tb2RlbC5pZHNbcm9vdF0ucGFyZW50XG4gICAgaWYgKCF0aGlzLm1vZGVsLmlkc1twaWRdKSByZXR1cm5cbiAgICB0aGlzLmFjdGlvbnMuY2xpY2tCdWxsZXQocGlkKVxuICB9LFxuICBzZXRUYWdzOiBmdW5jdGlvbiAoaWQsIGlkcykge1xuICAgIHRoaXMuZXhlY3V0ZUNvbW1hbmRzKCdzZXRUYWdzJywgW2lkLCBpZHNdKVxuICB9LFxuICBhZGRUYWc6IGZ1bmN0aW9uIChpZCwgY29udGVudHMpIHtcbiAgICByZXR1cm4gdGhpcy5leGVjdXRlQ29tbWFuZHMoJ2FkZFRhZycsIFtjb250ZW50c10pWzBdO1xuICB9LFxufSwgQ29udHJvbGxlci5wcm90b3R5cGUuYWN0aW9ucylcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVyJyksXG4gIE1vZGVsOiByZXF1aXJlKCcuL21vZGVsJyksXG4gIE5vZGU6IHJlcXVpcmUoJy4vbm9kZScpLFxuICBWaWV3OiByZXF1aXJlKCcuL3ZpZXcnKSxcbiAgVmlld0xheWVyOiByZXF1aXJlKCcuL3ZsJyksXG59XG5cbiIsIlxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi4vLi4vbGliL21vZGVsJylcblxubW9kdWxlLmV4cG9ydHMgPSBXRk1vZGVsXG5cbmZ1bmN0aW9uIFdGTW9kZWwoKSB7XG4gIE1vZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuV0ZNb2RlbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE1vZGVsLnByb3RvdHlwZSlcblxuV0ZNb2RlbC5wcm90b3R5cGUuYWN0aW9ucyA9IHtcbiAgcmVzb2x2ZVRhZ3M6IGZ1bmN0aW9uICh0YWdzKSB7XG4gICAgaWYgKCF0YWdzKSByZXR1cm4gW11cbiAgICByZXR1cm4gdGFncy5tYXAoZnVuY3Rpb24gKGlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZHNbaWRdXG4gICAgfS5iaW5kKHRoaXMpKVxuICB9LFxuICBnZXRBbGxUYWdzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRhZ3MgPSBbXVxuICAgIGZvciAodmFyIGlkIGluIHRoaXMuaWRzKSB7XG4gICAgICB0YWdzLnB1c2godGhpcy5pZHNbaWRdKVxuICAgIH1cbiAgICAvLyB0b2RvIHNvcnQgYnkgbnVtYmVyIG9mIHJlZmVyZW5jZXNcbiAgICByZXR1cm4gdGFnc1xuICB9XG59XG5cbldGTW9kZWwucHJvdG90eXBlLmhhc1RhZ1Jvb3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAhIXRoaXMucm9vdE5vZGUudGFnUm9vdFxufVxuXG5XRk1vZGVsLnByb3RvdHlwZS5hZGRUYWdSb290ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgaW5kZXggPSB0aGlzLmlkc1t0aGlzLnJvb3RdLmNoaWxkcmVuID8gdGhpcy5pZHNbdGhpcy5yb290XS5jaGlsZHJlbi5sZW5ndGggOiAwXG4gIHZhciBjciA9IG1vZGVsLmNyZWF0ZSh0aGlzLnJvb3QsIGluZGV4LCAnVGFncycpXG4gIHRoaXMucm9vdE5vZGUudGFnUm9vdCA9IGNyLm5vZGUuaWRcbiAgdGhpcy5kYi51cGRhdGUoJ3Jvb3QnLCB0aGlzLnJvb3QsIHt0YWdSb290OiBjci5ub2RlLmlkfSlcbiAgcmV0dXJuIGNyXG59XG5cbldGTW9kZWwucHJvdG90eXBlLmFkZFRhZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHZhciB0YWdSb290ID0gdGhpcy5yb290Tm9kZS50YWdSb290XG4gIHZhciBpbmRleCA9IHRoaXMuaWRzW3RhZ1Jvb3RdLmNoaWxkcmVuID8gdGhpcy5pZHNbdGFnUm9vdF0uY2hpbGRyZW4ubGVuZ3RoIDogMFxuICB2YXIgY3IgPSBtb2RlbC5jcmVhdGUodGFnUm9vdCwgaW5kZXgsIG5hbWUpXG4gIHJldHVybiBjclxufVxuXG5XRk1vZGVsLnByb3RvdHlwZS5yZWFkZCA9IGZ1bmN0aW9uIChzYXZlZCkge1xuICB0aGlzLmlkc1tzYXZlZC5pZF0gPSBzYXZlZC5ub2RlXG4gIHZhciBjaGlsZHJlbiA9IHRoaXMuaWRzW3NhdmVkLm5vZGUucGFyZW50XS5jaGlsZHJlblxuICBjaGlsZHJlbi5zcGxpY2Uoc2F2ZWQuaXgsIDAsIHNhdmVkLmlkKVxuICB2YXIgYmVmb3JlID0gZmFsc2VcbiAgaWYgKHNhdmVkLml4IDwgY2hpbGRyZW4ubGVuZ3RoIC0gMSkge1xuICAgIGJlZm9yZSA9IGNoaWxkcmVuW3NhdmVkLml4ICsgMV1cbiAgfVxuXG4gIHZhciB1cFJlZnMgPSB7fVxuICB2YXIgdXBUYWdzID0ge31cbiAgdmFyIGlkcyA9IHRoaXMuaWRzXG5cbiAgZnVuY3Rpb24gcHJvY2Vzcyhub2RlKSB7XG4gICAgZm9yICh2YXIgaT0wOyBpPG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb2Nlc3MoaWRzW25vZGUuY2hpbGRyZW5baV1dKVxuICAgIH1cblxuICAgIGlmIChub2RlLm1ldGEudGFncykge1xuICAgICAgbm9kZS5tZXRhLnRhZ3MuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIHJlZnMgPSBpZHNbaWRdLm1ldGEucmVmZXJlbmNlc1xuICAgICAgICBpZiAoIXJlZnMpIHtcbiAgICAgICAgICByZWZzID0gaWRzW2lkXS5tZXRhLnJlZmVyZW5jZXMgPSBbXVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZWZzLmluZGV4T2Yobm9kZS5pZCkgIT09IC0xKSByZXR1cm4gY29uc29sZS53YXJuKCdkdXBsaWNhdGUgcmVmIG9uIHJlYWRkJylcbiAgICAgICAgcmVmcy5wdXNoKG5vZGUuaWQpXG4gICAgICAgIHVwUmVmc1tpZF0gPSB0cnVlXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChub2RlLm1ldGEucmVmZXJlbmNlcykge1xuICAgICAgbm9kZS5tZXRhLnJlZmVyZW5jZXMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWRzW2lkXS5tZXRhLnRhZ3MucHVzaChub2RlLmlkKVxuICAgICAgICB2YXIgdGFncyA9IGlkc1tpZF0ubWV0YS50YWdzXG4gICAgICAgIGlmICghdGFncykge1xuICAgICAgICAgIHRhZ3MgPSBpZHNbaWRdLm1ldGEudGFncyA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhZ3MuaW5kZXhPZihub2RlLmlkKSAhPT0gLTEpIHJldHVybiBjb25zb2xlLndhcm4oJ2R1cGxpY2F0ZSB0YWcgb24gcmVhZGQnKVxuICAgICAgICB0YWdzLnB1c2gobm9kZS5pZClcbiAgICAgICAgdXBUYWdzW2lkXSA9IHRydWVcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcHJvY2Vzcyh0aGlzLmlkc1tzYXZlZC5pZF0pXG5cbiAgdGhpcy5kYi5zYXZlKCdub2RlJywgc2F2ZWQubm9kZS5pZCwgc2F2ZWQubm9kZSlcbiAgdGhpcy5kYi51cGRhdGUoJ25vZGUnLCBzYXZlZC5ub2RlLnBhcmVudCwge2NoaWxkcmVuOiBjaGlsZHJlbn0pXG5cbiAgZm9yIChpZCBpbiB1cFRhZ3MpIHtcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7dGFnczogdGhpcy5pZHNbaWRdLnRhZ3N9KVxuICB9XG5cbiAgZm9yIChpZCBpbiB1cFJlZnMpIHtcbiAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7cmVmZXJlbmNlczogdGhpcy5pZHNbaWRdLnJlZmVyZW5jZXN9KVxuICB9XG5cbiAgcmV0dXJuIGJlZm9yZVxufVxuXG5XRk1vZGVsLnByb3RvdHlwZS5kdW1wRGF0YSA9IGZ1bmN0aW9uIChpZCwgbm9pZHMpIHtcbiAgdmFyIGRhdGEgPSBNb2RlbC5wcm90b3R5cGUuZHVtcERhdGEuY2FsbCh0aGlzLCBpZCwgbm9pZHMpXG4gIGlmICghbm9pZHMpIHJldHVybiBkYXRhXG4gIGRlbGV0ZSBkYXRhLm1ldGEucmVmZXJlbmNlc1xuICBkZWxldGUgZGF0YS5tZXRhLnRhZ3NcbiAgcmV0dXJuIGRhdGFcbn1cblxuV0ZNb2RlbC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGlkKSB7XG4gIC8vIHJlbW92ZSB0aGUgcmVmZXJlbmNlcyBhbmQgdGFnc1xuXG4gIGlmIChpZCA9PT0gdGhpcy5yb290KSByZXR1cm5cbiAgdmFyIG4gPSB0aGlzLmlkc1tpZF1cbiAgICAsIHAgPSB0aGlzLmlkc1tuLnBhcmVudF1cbiAgICAsIGl4ID0gcC5jaGlsZHJlbi5pbmRleE9mKGlkKVxuXG4gIHZhciB1cFJlZnMgPSB7fVxuICB2YXIgdXBUYWdzID0ge31cbiAgdmFyIGlkcyA9IHRoaXMuaWRzXG4gIHZhciByZW1vdmVkID0gW11cblxuICBmdW5jdGlvbiBwcm9jZXNzKG5vZGUpIHtcbiAgICBpZiAobm9kZS5tZXRhLnRhZ3MpIHtcbiAgICAgIG5vZGUubWV0YS50YWdzLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciByZWZzID0gaWRzW2lkXS5tZXRhLnJlZmVyZW5jZXNcbiAgICAgICAgdXBSZWZzW2lkXSA9IHRydWVcbiAgICAgICAgcmVmcy5zcGxpY2UocmVmcy5pbmRleE9mKG5vZGUuaWQpLCAxKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tZXRhLnJlZmVyZW5jZXMpIHtcbiAgICAgIG5vZGUubWV0YS5yZWZlcmVuY2VzLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciB0YWdzID0gaWRzW2lkXS5tZXRhLnRhZ3NcbiAgICAgICAgdXBUYWdzW2lkXSA9IHRydWVcbiAgICAgICAgdGFncy5zcGxpY2UodGFncy5pbmRleE9mKG5vZGUuaWQpLCAxKVxuICAgICAgfSlcbiAgICB9XG4gICAgZm9yICh2YXIgaT0wOyBpPG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByb2Nlc3MoaWRzW25vZGUuY2hpbGRyZW5baV1dKVxuICAgIH1cblxuICAgIGRlbGV0ZSBpZHNbbm9kZS5pZF1cbiAgICByZW1vdmVkLnB1c2gobm9kZS5pZClcbiAgfVxuXG4gIHByb2Nlc3MobilcblxuICBwLmNoaWxkcmVuLnNwbGljZShpeCwgMSlcbiAgZGVsZXRlIHRoaXMuaWRzW2lkXVxuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGIucmVtb3ZlQmF0Y2goJ25vZGUnLCByZW1vdmVkKVxuICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgbi5wYXJlbnQsIHtjaGlsZHJlbjogcC5jaGlsZHJlbn0pXG5cblxuICAgIGlmIChpZCA9PT0gdGhpcy5yb290Tm9kZS50YWdSb290KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290Tm9kZS50YWdSb290XG4gICAgICB0aGlzLmRiLnVwZGF0ZSgncm9vdCcsIHRoaXMucm9vdCwge3RhZ1Jvb3Q6IG51bGx9KVxuICAgIH1cblxuICAgIGZvciAoaWQgaW4gdXBUYWdzKSB7XG4gICAgICBpZiAodGhpcy5pZHNbaWRdKSB7XG4gICAgICAgIHRoaXMuZGIudXBkYXRlKCdub2RlJywgaWQsIHt0YWdzOiB0aGlzLmlkc1tpZF0ubWV0YS50YWdzfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGlkIGluIHVwUmVmcykge1xuICAgICAgaWYgKHRoaXMuaWRzW2lkXSkge1xuICAgICAgICB0aGlzLmRiLnVwZGF0ZSgnbm9kZScsIGlkLCB7cmVmZXJlbmNlczogdGhpcy5pZHNbaWRdLm1ldGEucmVmZXJlbmNlc30pXG4gICAgICB9XG4gICAgfVxuICB9LmJpbmQodGhpcykpXG5cbiAgcmV0dXJuIHtpZDogaWQsIG5vZGU6IG4sIGl4OiBpeH1cbn1cblxuLy8gVE9ETyBzaG91bGQgSSBtYWtlIHJlZmVyZW5jZXMgYmUgYSBkaWN0IGluc3RlYWQ/XG5XRk1vZGVsLnByb3RvdHlwZS5zZXRUYWdzID0gZnVuY3Rpb24gKGlkLCB0YWdzKSB7XG4gIHZhciBvbGQgPSB0aGlzLmlkc1tpZF0ubWV0YS50YWdzXG4gIHZhciB1c2VkID0ge31cbiAgaWYgKG9sZCkgb2xkID0gb2xkLnNsaWNlKClcblxuICAvLyBhZGQgcmVmZXJlbmNlc1xuICBpZiAodGFncykge1xuICAgIGZvciAodmFyIGk9MDsgaTx0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB1c2VkW3RhZ3NbaV1dID0gdHJ1ZVxuICAgICAgdmFyIHJlZnMgPSB0aGlzLmlkc1t0YWdzW2ldXS5tZXRhLnJlZmVyZW5jZXNcbiAgICAgIGlmICghcmVmcykge1xuICAgICAgICByZWZzID0gdGhpcy5pZHNbdGFnc1tpXV0ubWV0YS5yZWZlcmVuY2VzID0gW11cbiAgICAgIH1cbiAgICAgIGlmIChyZWZzLmluZGV4T2YoaWQpID09PSAtMSkge1xuICAgICAgICByZWZzLnB1c2goaWQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcmVtb3ZlIG9sZCByZWZlcmVuY2VzIHRoYXQgd2VyZSByZW1vdmVkXG4gIGlmIChvbGQpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8b2xkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodXNlZFtvbGRbaV1dKSBjb250aW51ZTtcbiAgICAgIHZhciByZWZzID0gdGhpcy5pZHNbb2xkW2ldXS5tZXRhLnJlZmVyZW5jZXNcbiAgICAgIHJlZnMuc3BsaWNlKHJlZnMuaW5kZXhPZihpZCksIDEpXG4gICAgICB1c2VkW29sZFtpXV0gPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgdGhpcy5pZHNbaWRdLm1ldGEudGFncyA9IHRhZ3NcbiAgLy8gdXBkYXRlIHRoaW5nc1xuICB0aGlzLmRiLnVwZGF0ZShpZCwge21ldGE6IHRoaXMuaWRzW2lkXS5tZXRhfSlcbiAgZm9yICh2YXIgb2lkIGluIHVzZWQpIHtcbiAgICB0aGlzLmRiLnVwZGF0ZShvaWQsIHttZXRhOiB0aGlzLmlkc1tvaWRdLm1ldGF9KVxuICB9XG4gIHJldHVybiBvbGRcbn1cblxuV0ZNb2RlbC5wcm90b3R5cGUuZ2V0TGluZWFnZSA9IGZ1bmN0aW9uIChpZCkge1xuICB2YXIgbGluZWFnZSA9IFtdXG4gIHdoaWxlICh0aGlzLmlkc1tpZF0pIHtcbiAgICBsaW5lYWdlLnVuc2hpZnQoe1xuICAgICAgY29udGVudDogdGhpcy5pZHNbaWRdLmNvbnRlbnQsXG4gICAgICBpZDogaWRcbiAgICB9KVxuICAgIGlkID0gdGhpcy5pZHNbaWRdLnBhcmVudFxuICB9XG4gIHJldHVybiBsaW5lYWdlXG59XG5cbldGTW9kZWwucHJvdG90eXBlLnNlYXJjaCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIHZhciBpdGVtcyA9IFtdXG4gICAgLCBmcm9udGllciA9IFt0aGlzLnJvb3RdXG4gIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKClcbiAgd2hpbGUgKGZyb250aWVyLmxlbmd0aCkge1xuICAgICAgdmFyIG5leHQgPSBbXVxuICAgICAgZm9yICh2YXIgaT0wOyBpPGZyb250aWVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzLmlkc1tmcm9udGllcltpXV0uY29udGVudFxuICAgICAgICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgaXRlbXMucHVzaCh7aWQ6IGZyb250aWVyW2ldLCB0ZXh0OiB0aGlzLmlkc1tmcm9udGllcltpXV0uY29udGVudH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuaWRzW2Zyb250aWVyW2ldXS5jaGlsZHJlblxuICAgICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgbmV4dCA9IG5leHQuY29uY2F0KGNoaWxkcmVuKVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZyb250aWVyID0gbmV4dFxuICB9XG4gIHJldHVybiBpdGVtc1xufVxuXG4iLCJcbnZhciBEZWZhdWx0Tm9kZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kZWZhdWx0LW5vZGUnKVxudmFyIFRhZ3MgPSByZXF1aXJlKCcuL3RhZ3MnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdGTm9kZVxuXG5mdW5jdGlvbiBXRk5vZGUoY29udGVudCwgbWV0YSwgYWN0aW9ucywgaXNOZXcsIG1vZGVsQWN0aW9ucykge1xuICBEZWZhdWx0Tm9kZS5jYWxsKHRoaXMsIGNvbnRlbnQsIG1ldGEsIGFjdGlvbnMsIGlzTmV3LCBtb2RlbEFjdGlvbnMpXG4gIHRoaXMuZG9uZSA9IG1ldGEuZG9uZVxuICB0aGlzLnRhZ3MgPSBuZXcgVGFncyhtb2RlbEFjdGlvbnMucmVzb2x2ZVRhZ3MobWV0YS50YWdzKSwgYWN0aW9ucywgbW9kZWxBY3Rpb25zKVxuICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy50YWdzLm5vZGUpXG4gIGlmIChtZXRhLmRvbmUpIHtcbiAgICB0aGlzLm5vZGUuY2xhc3NMaXN0LmFkZCgndHJlZWRfX2RlZmF1bHQtbm9kZS0tZG9uZScpXG4gIH1cbn1cblxuV0ZOb2RlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGVmYXVsdE5vZGUucHJvdG90eXBlKVxuV0ZOb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFdGTm9kZVxuXG5XRk5vZGUucHJvdG90eXBlLnNldEF0dHIgPSBmdW5jdGlvbiAoYXR0ciwgdmFsdWUpIHtcbiAgaWYgKGF0dHIgPT09ICd0YWdzJykge1xuICAgIHJldHVybiB0aGlzLnNldFRhZ3ModmFsdWUpXG4gIH1cbiAgaWYgKGF0dHIgPT09ICdkb25lJykge1xuICAgIHJldHVybiB0aGlzLnNldERvbmUodmFsdWUpXG4gIH1cbiAgRGVmYXVsdE5vZGUucHJvdG90eXBlLnNldEF0dHIuY2FsbCh0aGlzLCBhdHRyLCB2YWx1ZSlcbn1cblxuV0ZOb2RlLnByb3RvdHlwZS5hZGRUYWcgPSBmdW5jdGlvbiAobm9kZSkge1xuICB0aGlzLnRhZ3MuYWRkKG5vZGUpXG59XG5cbldGTm9kZS5wcm90b3R5cGUucmVtb3ZlVGFnID0gZnVuY3Rpb24gKHRpZCkge1xuICB0aGlzLnRhZ3MucmVtb3ZlRnVsbCh0aWQpXG59XG5cbldGTm9kZS5wcm90b3R5cGUuc2V0VGFncyA9IGZ1bmN0aW9uICh0YWdzKSB7XG4gIHRoaXMudGFncy5zZXQodGhpcy5tb2RlbEFjdGlvbnMucmVzb2x2ZVRhZ3ModGFncykpXG59XG5cbldGTm9kZS5wcm90b3R5cGUuc2V0RG9uZSA9IGZ1bmN0aW9uIChpc0RvbmUpIHtcbiAgdGhpcy5kb25lID0gaXNEb25lXG4gIGlmIChpc0RvbmUpIHtcbiAgICB0aGlzLm5vZGUuY2xhc3NMaXN0LmFkZCgndHJlZWRfX2RlZmF1bHQtbm9kZS0tZG9uZScpXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3RyZWVkX19kZWZhdWx0LW5vZGUtLWRvbmUnKVxuICB9XG59XG5cbldGTm9kZS5wcm90b3R5cGUuZXh0cmFfYWN0aW9ucyA9IHtcbiAgJ3JlYmFzZSc6IHtcbiAgICBiaW5kaW5nOiAnYWx0K3JldHVybicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8uY2xpY2tCdWxsZXQoKVxuICAgIH1cbiAgfSxcbiAgJ2JhY2sgYSBsZXZlbCc6IHtcbiAgICBiaW5kaW5nOiAnc2hpZnQrYWx0K3JldHVybicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm8uYmFja0FMZXZlbCgpXG4gICAgfVxuICB9LFxuICAndG9nZ2xlIGRvbmUnOiB7XG4gICAgYmluZGluZzogJ2N0cmwrcmV0dXJuJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuYmx1cigpXG4gICAgICB0aGlzLm8uY2hhbmdlZCgnZG9uZScsICF0aGlzLmRvbmUpXG4gICAgICB0aGlzLmZvY3VzKClcbiAgICAgIGlmICh0aGlzLmRvbmUpIHtcbiAgICAgICAgdGhpcy5vLmdvRG93bigpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBUYWdzXG5cbmZ1bmN0aW9uIFRhZ3ModGFncywgYWN0aW9ucywgbW9kZWxhY3Rpb25zKSB7XG4gIHRoaXMuYWN0aW9ucyA9IGFjdGlvbnNcbiAgdGhpcy5tb2RlbGFjdGlvbnMgPSBtb2RlbGFjdGlvbnNcbiAgdGhpcy5zZXR1cE5vZGUoKVxuICB0aGlzLnNldCh0YWdzKVxufVxuXG5UYWdzLnByb3RvdHlwZSA9IHtcbiAgc2V0dXBOb2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLm5vZGUuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3MnXG5cbiAgICB0aGlzLmhhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5oYW5kbGUuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3NfaGFuZGxlJ1xuICAgIHRoaXMuaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5zdGFydEVkaXRpbmcuYmluZCh0aGlzKSlcbiAgICB0aGlzLmhhbmRsZS5pbm5lckhUTUwgPSAnPGkgY2xhc3M9XCJmYSBmYS10YWdcIi8+J1xuXG4gICAgdGhpcy50YWdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLnRhZ3MuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3NfbGlzdCdcblxuICAgIHRoaXMuZWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLmVkaXRvci5jbGFzc05hbWUgPSAndHJlZWRfdGFnc19lZGl0b3InXG5cbiAgICB0aGlzLmlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKVxuICAgIHRoaXMuaW5wdXQuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3NfaW5wdXQnXG5cbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleURvd24uYmluZCh0aGlzKSlcbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5rZXlVcC5iaW5kKHRoaXMpKVxuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMub25CbHVyLmJpbmQodGhpcykpXG5cbiAgICB0aGlzLnJlc3VsdHNOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKVxuICAgIHRoaXMucmVzdWx0c05vZGUuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3NfcmVzdWx0cydcbiAgICB0aGlzLnRhZ3MuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtlLnByZXZlbnREZWZhdWx0KCl9KVxuICAgIHRoaXMucmVzdWx0c05vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtlLnByZXZlbnREZWZhdWx0KCl9KVxuXG4gICAgdGhpcy5uZXdOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB0aGlzLm5ld05vZGUuY2xhc3NOYW1lID0gJ3RyZWVkX3RhZ3NfbmV3J1xuICAgIHRoaXMubmV3Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge2UucHJldmVudERlZmF1bHQoKX0pXG4gICAgdGhpcy5uZXdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbk5ldy5iaW5kKHRoaXMpKVxuICAgIHRoaXMubmV3Tm9kZS5pbm5lclRleHQgPSAnQ3JlYXRlIG5ldyB0YWcnXG5cbiAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy50YWdzKVxuICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLmhhbmRsZSlcbiAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lZGl0b3IpXG5cbiAgICB0aGlzLmVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmlucHV0KVxuICAgIHRoaXMuZWRpdG9yLmFwcGVuZENoaWxkKHRoaXMucmVzdWx0c05vZGUpXG4gICAgdGhpcy5lZGl0b3IuYXBwZW5kQ2hpbGQodGhpcy5uZXdOb2RlKVxuXG4gICAgdGhpcy5kb20gPSB7fVxuICB9LFxuXG4gIHN0YXJ0RWRpdGluZzogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICB0aGlzLmFjdGlvbnMuc2V0QWN0aXZlKClcbiAgICB0aGlzLmVkaXRpbmcgPSB0cnVlXG4gICAgdGhpcy5ub2RlLmNsYXNzTGlzdC5hZGQoJ3RyZWVkX3RhZ3MtLW9wZW4nKVxuICAgIHRoaXMuZnVsbFJlc3VsdHMgPSB0aGlzLm1vZGVsYWN0aW9ucy5nZXRBbGxUYWdzKClcbiAgICB0aGlzLmZpbHRlckJ5KCcnKVxuICAgIHRoaXMuc2VsZWN0aW9uID0gMFxuICAgIHRoaXMuaW5wdXQudmFsdWUgPSAnJ1xuICAgIHRoaXMuaW5wdXQuZm9jdXMoKVxuICAgIHRoaXMuc2hvd1Jlc3VsdHMoKVxuICAgIC8vIHRvZG8gc2hvdyBldmVyeXRoaW5nIGZpcnN0PyBJIHRoaW5rIEknbGwgd2FpdCBmb3IgZmlyc3Qga2V5IGNoYW5nZVxuICB9LFxuXG4gIGRvbmVFZGl0aW5nOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICghdGhpcy5lZGl0aW5nKSByZXR1cm5cbiAgICB0aGlzLmVkaXRpbmcgPSBmYWxzZVxuICAgIHRoaXMubm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd0cmVlZF90YWdzLS1vcGVuJylcbiAgICB0aGlzLmFjdGlvbnMuc2V0VGFncyh0aGlzLnZhbHVlLm1hcChmdW5jdGlvbiAoeCl7IHJldHVybiB4LmlkIH0pKVxuICB9LFxuXG4gIG9uQmx1cjogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZG9uZUVkaXRpbmcoKVxuICB9LFxuXG4gIGtleXM6IHtcbiAgICAyNzogZnVuY3Rpb24gKGUpIHsgLy8gZXNjYXBlXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHRoaXMuZG9uZUVkaXRpbmcoKVxuICAgIH0sXG4gICAgOTogZnVuY3Rpb24gKGUpIHsgLy8gdGFiXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHRoaXMuYWRkQ3VycmVudCgpXG4gICAgfSxcbiAgICAxMzogZnVuY3Rpb24gKGUpIHsgLy8gcmV0dXJuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHRoaXMuYWRkQ3VycmVudCgpXG4gICAgICB0aGlzLmRvbmVFZGl0aW5nKClcbiAgICB9LFxuICAgIDg6IGZ1bmN0aW9uIChlKSB7IC8vIGJhY2tzcGFjZVxuICAgICAgaWYgKCF0aGlzLmlucHV0LnZhbHVlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICB0aGlzLnJlbW92ZUxhc3QoKVxuICAgICAgfVxuICAgIH0sXG4gIH0sXG5cbiAga2V5RG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgYWN0aW9uID0gdGhpcy5rZXlzW2Uua2V5Q29kZV1cbiAgICBpZiAoYWN0aW9uKSByZXR1cm4gYWN0aW9uLmNhbGwodGhpcywgZSlcbiAgfSxcblxuICBrZXlVcDogZnVuY3Rpb24gKGUpIHtcbiAgICB0aGlzLmZpbHRlckJ5KHRoaXMuaW5wdXQudmFsdWUpXG4gICAgdGhpcy5zaG93UmVzdWx0cygpXG4gIH0sXG5cbiAgZmlsdGVyQnk6IGZ1bmN0aW9uIChuZWVkbGUpIHtcbiAgICB2YXIgdXNlZCA9IHt9XG4gICAgZm9yICh2YXIgaT0wOyBpPHRoaXMudmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHVzZWRbdGhpcy52YWx1ZVtpXS5pZF0gPSB0cnVlXG4gICAgfVxuICAgIGlmICghbmVlZGxlKSB7XG4gICAgICB0aGlzLnJlc3VsdHMgPSB0aGlzLmZ1bGxSZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgIHJldHVybiAhdXNlZFt0YWcuaWRdXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBuZWVkbGUgPSBuZWVkbGUudG9Mb3dlckNhc2UoKVxuICAgICAgdGhpcy5yZXN1bHRzID0gdGhpcy5mdWxsUmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24gKHRhZykge1xuICAgICAgICByZXR1cm4gIXVzZWRbdGFnLmlkXSAmJiB0YWcuY29udGVudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YobmVlZGxlKSAhPT0gLTFcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIHNob3dSZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgd2hpbGUgKHRoaXMucmVzdWx0c05vZGUubGFzdENoaWxkKSB7XG4gICAgICB0aGlzLnJlc3VsdHNOb2RlLnJlbW92ZUNoaWxkKHRoaXMucmVzdWx0c05vZGUubGFzdENoaWxkKVxuICAgIH1cbiAgICB2YXIgbnVtID0gNVxuICAgIGlmIChudW0gPiB0aGlzLnJlc3VsdHMubGVuZ3RoKSBudW0gPSB0aGlzLnJlc3VsdHMubGVuZ3RoXG4gICAgdmFyIGNsaWNrID0gZnVuY3Rpb24gKHRhZywgZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICB0aGlzLmFkZEN1cnJlbnQodGFnKVxuICAgIH1cbiAgICBmb3IgKHZhciBpPTA7IGk8bnVtOyBpKyspIHtcbiAgICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuICAgICAgbm9kZS5pbm5lclRleHQgPSB0aGlzLnJlc3VsdHNbaV0uY29udGVudFxuICAgICAgbm9kZS5jbGFzc05hbWUgPSAndHJlZWRfdGFnc19yZXN1bHQnXG4gICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2suYmluZCh0aGlzLCB0aGlzLnJlc3VsdHNbaV0pKVxuICAgICAgdGhpcy5yZXN1bHRzTm9kZS5hcHBlbmRDaGlsZChub2RlKVxuICAgIH1cbiAgfSxcblxuICBvbk5ldzogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pbnB1dC52YWx1ZS5sZW5ndGgpIHJldHVyblxuICAgIHZhciB0YWcgPSB0aGlzLmFjdGlvbnMuYWRkVGFnKHRoaXMuaW5wdXQudmFsdWUpXG4gICAgdGhpcy5hZGRDdXJyZW50KHRhZylcbiAgfSxcblxuICBhZGRDdXJyZW50OiBmdW5jdGlvbiAodGFnKSB7XG4gICAgaWYgKCF0YWcpIHtcbiAgICAgIGlmICghdGhpcy5pbnB1dC52YWx1ZS5sZW5ndGgpIHJldHVyblxuICAgICAgaWYgKCF0aGlzLnJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgIHRhZyA9IHRoaXMuYWN0aW9ucy5hZGRUYWcodGhpcy5pbnB1dC52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhZyA9IHRoaXMucmVzdWx0c1t0aGlzLnNlbGVjdGlvbl1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWUuaW5kZXhPZih0YWcpICE9PSAtMSkgcmV0dXJuIHRoaXMucmVzZXRTZWFyY2goKVxuICAgIHRoaXMudmFsdWUucHVzaCh0YWcpXG4gICAgdGhpcy5hZGQodGFnKVxuICAgIHRoaXMucmVzZXRTZWFyY2goKVxuICB9LFxuXG4gIHJlc2V0U2VhcmNoOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pbnB1dC52YWx1ZSA9ICcnXG4gICAgdGhpcy5maWx0ZXJCeSgnJylcbiAgICB0aGlzLnNlbGVjdGlvbiA9IDBcbiAgICB0aGlzLnNob3dSZXN1bHRzKClcbiAgfSxcblxuICByZW1vdmVMYXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aCkgcmV0dXJuXG4gICAgdmFyIGxhc3QgPSB0aGlzLnZhbHVlLnBvcCgpXG4gICAgdGhpcy5yZW1vdmUobGFzdC5pZClcbiAgICB0aGlzLnJlc2V0U2VhcmNoKClcbiAgfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uIChpZCkge1xuICAgIHRoaXMudGFncy5yZW1vdmVDaGlsZCh0aGlzLmRvbVtpZF0pXG4gICAgZGVsZXRlIHRoaXMuZG9tW2lkXVxuICB9LFxuXG4gIHJlbW92ZUZ1bGw6IGZ1bmN0aW9uIChpZCkge1xuICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZVtpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgdGhpcy52YWx1ZS5zcGxpY2UoaSwgMSlcbiAgICAgICAgdGhpcy5yZW1vdmUoaWQpXG4gICAgICAgIHRoaXMucmVzZXRTZWFyY2goKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbiAodGFncykge1xuICAgIHRoaXMudmFsdWUgPSB0YWdzIHx8IFtdXG4gICAgd2hpbGUgKHRoaXMudGFncy5sYXN0Q2hpbGQpIHRoaXMudGFncy5yZW1vdmVDaGlsZCh0aGlzLnRhZ3MubGFzdENoaWxkKVxuICAgIHRoaXMuZG9tID0ge31cbiAgICB0aGlzLnZhbHVlLm1hcCh0aGlzLmFkZC5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIGFkZDogZnVuY3Rpb24gKHRhZykge1xuICAgIGlmICh0aGlzLmRvbVt0YWcuaWRdKSByZXR1cm4gY29uc29sZS53YXJuKCd0cmllZCB0byBhZGQgZHVwbGljYXRlIHRhZycpXG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuZG9tW3RhZy5pZF0gPSBub2RlXG4gICAgbm9kZS5jbGFzc05hbWUgPSAndHJlZWRfdGFnJ1xuXG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJylcbiAgICBjb250ZW50LmlubmVyVGV4dCA9IHRhZy5jb250ZW50XG4gICAgbm9kZS5hcHBlbmRDaGlsZChjb250ZW50KVxuXG4gICAgdmFyIHJlbW92ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgIHJlbW92ZS5jbGFzc05hbWUgPSAndHJlZWRfdGFnX3JlbW92ZSdcbiAgICByZW1vdmUuaW5uZXJIVE1MID0gJyAmdGltZXM7J1xuICAgIHZhciBybUZ1bmMgPSB0aGlzLnJlbW92ZUZ1bGwuYmluZCh0aGlzLCB0YWcuaWQpXG4gICAgcmVtb3ZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgcm1GdW5jKClcbiAgICB9KVxuXG4gICAgbm9kZS5hcHBlbmRDaGlsZChyZW1vdmUpXG5cbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgaWYgKHRoaXMuZWRpdGluZykgcmV0dXJuXG4gICAgICB0aGlzLmFjdGlvbnMucmViYXNlKHRhZy5pZClcbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy50YWdzLmFwcGVuZENoaWxkKG5vZGUpXG4gIH0sXG59XG5cbiIsIlxudmFyIFZpZXcgPSByZXF1aXJlKCcuLi8uLi9saWIvdmlldycpXG5cbm1vZHVsZS5leHBvcnRzID0gV0ZWaWV3XG5cbmZ1bmN0aW9uIFdGVmlldygpIHtcbiAgVmlldy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbldGVmlldy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFZpZXcucHJvdG90eXBlKVxuXG5XRlZpZXcucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAocm9vdCkge1xuICB2YXIgcm9vdE5vZGUgPSBWaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgcm9vdClcbiAgICAsIG5vZGUgPSB0aGlzLm1vZGVsLmlkc1tyb290XVxuICBpZiAobm9kZS5tZXRhLnJlZmVyZW5jZXMpIHtcbiAgICB0aGlzLnZsLnNldFJlZmVyZW5jZXMobm9kZS5tZXRhLnJlZmVyZW5jZXMubWFwKGZ1bmN0aW9uIChpZCkge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuaWRzW2lkXVxuICAgIH0uYmluZCh0aGlzKSksIHRoaXMucmViYXNlLmJpbmQodGhpcykpXG4gIH1cbiAgcmV0dXJuIHJvb3ROb2RlXG59XG5cbldGVmlldy5wcm90b3R5cGUuYWRkVHJlZSA9IGZ1bmN0aW9uIChub2RlLCBiZWZvcmUpIHtcbiAgaWYgKCF0aGlzLnZsLmJvZHkobm9kZS5wYXJlbnQpKSB7XG4gICAgcmV0dXJuIHRoaXMucmViYXNlKG5vZGUucGFyZW50LCB0cnVlKVxuICB9XG4gIHRoaXMuYWRkKG5vZGUsIGJlZm9yZSlcblxuICBpZiAobm9kZS5tZXRhLnRhZ3MpIHtcbiAgICBub2RlLm1ldGEudGFncy5mb3JFYWNoKGZ1bmN0aW9uIChpZCkge1xuICAgICAgaWYgKGlkID09PSB0aGlzLnJvb3QpIHtcbiAgICAgICAgdGhpcy52bC5hZGRSZWZlcmVuY2UodGhpcy5tb2RlbC5pZHNbbm9kZS5pZF0sIHRoaXMucmViYXNlLmJpbmQodGhpcywgbm9kZS5pZCkpXG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgaWYgKG5vZGUubWV0YS5yZWZlcmVuY2VzKSB7XG4gICAgbm9kZS5tZXRhLnJlZmVyZW5jZXMuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHRoaXMudmwuYWRkVGFnKGlkLCBub2RlKVxuICAgIH0uYmluZCh0aGlzKSlcbiAgfVxuXG4gIGlmICghbm9kZS5jaGlsZHJlbiB8fCAhbm9kZS5jaGlsZHJlbi5sZW5ndGgpIHJldHVyblxuICBmb3IgKHZhciBpPTA7IGk8bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMuYWRkVHJlZSh0aGlzLm1vZGVsLmlkc1tub2RlLmNoaWxkcmVuW2ldXSwgZmFsc2UpXG4gIH1cbn1cblxuV0ZWaWV3LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoaWQsIGlnbm9yZUFjdGl2ZSkge1xuICB2YXIgbm9kZSA9IHRoaXMubW9kZWwuaWRzW2lkXVxuICAgICwgcGlkID0gbm9kZS5wYXJlbnRcbiAgICAsIHBhcmVudCA9IHRoaXMubW9kZWwuaWRzW3BpZF1cblxuICBpZiAoIXRoaXMudmwuYm9keShpZCkpIHtcbiAgICByZXR1cm4gdGhpcy5yZWJhc2UocGlkLCB0cnVlKVxuICB9XG4gIGlmIChpZCA9PT0gdGhpcy5hY3RpdmUgJiYgIWlnbm9yZUFjdGl2ZSkge1xuICAgIHRoaXMuc2V0QWN0aXZlKHRoaXMucm9vdClcbiAgfVxuXG4gIHRoaXMudmwucmVtb3ZlKGlkLCBwaWQsIHBhcmVudCAmJiBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxKVxuICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgIGlmIChwaWQgPT09IHRoaXMucm9vdCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmFkZE5ldyhwaWQsIDApXG4gICAgICB9LmJpbmQodGhpcyksMClcbiAgICB9XG4gIH1cblxuICAvLyByZW1vdmUgdGhlIHJlZmVyZW5jZXMgYW5kIHRhZ3NcblxuICB2YXIgaWRzID0gdGhpcy5tb2RlbC5pZHNcblxuICBmdW5jdGlvbiBwcm9jZXNzKG5vZGUpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvY2Vzcy5jYWxsKHRoaXMsIGlkc1tub2RlLmNoaWxkcmVuW2ldXSlcbiAgICB9XG5cbiAgICBpZiAobm9kZS5tZXRhLnJlZmVyZW5jZXMpIHtcbiAgICAgIG5vZGUubWV0YS5yZWZlcmVuY2VzLmZvckVhY2goZnVuY3Rpb24gKHJpZCkge1xuICAgICAgICB0aGlzLnZsLnJlbW92ZVRhZyhyaWQsIG5vZGUuaWQpXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKG5vZGUubWV0YS50YWdzKSB7XG4gICAgICBub2RlLm1ldGEudGFncy5mb3JFYWNoKGZ1bmN0aW9uICh0aWQpIHtcbiAgICAgICAgdGhpcy52bC5yZW1vdmVSZWZlcmVuY2UodGlkLCBub2RlLmlkKVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH1cbiAgfVxuXG4gIHByb2Nlc3MuY2FsbCh0aGlzLCBub2RlKVxufVxuXG5XRlZpZXcucHJvdG90eXBlLnNldEF0dHIgPSBmdW5jdGlvbiAoaWQsIGF0dHIsIHZhbHVlLCBxdWlldCkge1xuICB2YXIgcmVzID0gVmlldy5wcm90b3R5cGUuc2V0QXR0ci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIGlmIChhdHRyICE9PSAncmVmZXJlbmNlcycpIHJldHVybiByZXNcbiAgaWYgKGlkICE9PSB0aGlzLnJvb3QpIHJldHVyblxuICB0aGlzLnZsLnNldFJlZmVyZW5jZXModmFsdWUgJiYgdmFsdWUubWFwKGZ1bmN0aW9uIChpZCkge1xuICAgIHJldHVybiB0aGlzLm1vZGVsLmlkc1tpZF1cbiAgfS5iaW5kKHRoaXMpKSwgdGhpcy5yZWJhc2UuYmluZCh0aGlzKSlcbiAgcmV0dXJuIHJlc1xufVxuXG5XRlZpZXcucHJvdG90eXBlLnNldFRhZ3MgPSBmdW5jdGlvbiAoaWQsIHRhZ3MsIG9sZFRhZ3MpIHtcbiAgdmFyIHVzZWQgPSB7fVxuICBmb3IgKHZhciBpPTA7IGk8dGFncy5sZW5ndGg7IGkrKykge1xuICAgIHVzZWRbdGFnc1tpXV0gPSB0cnVlXG4gIH1cbiAgdGhpcy5zZXRBdHRyKGlkLCAndGFncycsIHRhZ3MpXG4gIGZvciAodmFyIGk9MDsgaTx0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5zZXRBdHRyKHRhZ3NbaV0sICdyZWZlcmVuY2VzJywgdGhpcy5tb2RlbC5pZHNbdGFnc1tpXV0ubWV0YS5yZWZlcmVuY2VzLCB0cnVlKVxuICB9XG4gIGlmIChvbGRUYWdzKSB7XG4gICAgZm9yICh2YXIgaT0wOyBpPG9sZFRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh1c2VkW29sZFRhZ3NbaV1dKSBjb250aW51ZTtcbiAgICAgIHRoaXMuc2V0QXR0cihvbGRUYWdzW2ldLCAncmVmZXJlbmNlcycsIHRoaXMubW9kZWwuaWRzW29sZFRhZ3NbaV1dLm1ldGEucmVmZXJlbmNlcywgdHJ1ZSlcbiAgICB9XG4gIH1cbn1cblxuV0ZWaWV3LnByb3RvdHlwZS5leHRyYV9hY3Rpb25zID0ge1xuICAnZWRpdCB0YWdzJzoge1xuICAgIGJpbmRpbmc6ICdzaGlmdCszJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudmwuZWRpdFRhZ3ModGhpcy5hY3RpdmUpXG4gICAgfSxcbiAgfSxcbiAgJ3JlYmFzZSc6IHtcbiAgICBiaW5kaW5nOiAnYWx0K3JldHVybicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmN0cmxhY3Rpb25zLmNsaWNrQnVsbGV0KHRoaXMuYWN0aXZlKVxuICAgIH1cbiAgfSxcbiAgJ2JhY2sgYSBsZXZlbCc6IHtcbiAgICBiaW5kaW5nOiAnc2hpZnQrYWx0K3JldHVybicsXG4gICAgYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmN0cmxhY3Rpb25zLmJhY2tBTGV2ZWwoKVxuICAgIH1cbiAgfSxcblxuICAndG9nZ2xlIGRvbmUnOiB7XG4gICAgYmluZGluZzogJ2N0cmwrcmV0dXJuJyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gbnVsbCkgcmV0dXJuXG4gICAgICB2YXIgaWQgPSB0aGlzLmFjdGl2ZVxuICAgICAgICAsIGRvbmUgPSAhdGhpcy5tb2RlbC5pZHNbaWRdLm1ldGEuZG9uZVxuICAgICAgICAsIG5leHQgPSB0aGlzLm1vZGVsLmlkQmVsb3coaWQsIHRoaXMucm9vdClcbiAgICAgIGlmIChuZXh0ID09PSB1bmRlZmluZWQpIG5leHQgPSBpZFxuICAgICAgdGhpcy5jdHJsYWN0aW9ucy5jaGFuZ2VkKHRoaXMuYWN0aXZlLCAnZG9uZScsIGRvbmUpXG4gICAgICBpZiAoZG9uZSkge1xuICAgICAgICB0aGlzLmdvVG8obmV4dClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuIiwiXG52YXIgRG9tVmlld0xheWVyID0gcmVxdWlyZSgnLi4vLi4vbGliL2RvbS12bCcpXG5cbm1vZHVsZS5leHBvcnRzID0gV0ZWTFxuXG5mdW5jdGlvbiBXRlZMKCkge1xuICBEb21WaWV3TGF5ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5XRlZMLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRG9tVmlld0xheWVyLnByb3RvdHlwZSlcblxuV0ZWTC5wcm90b3R5cGUucmVtb3ZlVGFnID0gZnVuY3Rpb24gKGlkLCB0aWQpIHtcbiAgdmFyIGJvZHkgPSB0aGlzLmJvZHkoaWQpXG4gIGlmICghYm9keSkgcmV0dXJuXG4gIGJvZHkucmVtb3ZlVGFnKHRpZClcbn1cblxuV0ZWTC5wcm90b3R5cGUuYWRkVGFnID0gZnVuY3Rpb24gKGlkLCBub2RlKSB7XG4gIHZhciBib2R5ID0gdGhpcy5ib2R5KGlkKVxuICBpZiAoIWJvZHkpIHJldHVyblxuICBib2R5LmFkZFRhZyhub2RlKVxufVxuXG5XRlZMLnByb3RvdHlwZS5lZGl0VGFncyA9IGZ1bmN0aW9uIChpZCkge1xuICB0aGlzLmJvZHkoaWQpLnRhZ3Muc3RhcnRFZGl0aW5nKClcbn1cblxuV0ZWTC5wcm90b3R5cGUubWFrZUhlYWQgPSBmdW5jdGlvbiAoYm9keSwgYWN0aW9ucykge1xuICB2YXIgaGVhZCA9IERvbVZpZXdMYXllci5wcm90b3R5cGUubWFrZUhlYWQuY2FsbCh0aGlzLCBib2R5LCBhY3Rpb25zKVxuICAgICwgYnVsbGV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgYnVsbGV0LmNsYXNzTGlzdC5hZGQoJ3RyZWVkX19idWxsZXQnKVxuICBidWxsZXQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgYWN0aW9ucy5jbGlja0J1bGxldClcbiAgaGVhZC5pbnNlcnRCZWZvcmUoYnVsbGV0LCBoZWFkLmNoaWxkTm9kZXNbMV0pXG4gIHJldHVybiBoZWFkXG59XG5cbldGVkwucHJvdG90eXBlLm1ha2VSb290ID0gZnVuY3Rpb24gKG5vZGUsIGJvdW5kcywgbW9kZWxBY3Rpb25zKSB7XG4gIHZhciByb290ID0gRG9tVmlld0xheWVyLnByb3RvdHlwZS5tYWtlUm9vdC5jYWxsKHRoaXMsIG5vZGUsIGJvdW5kcywgbW9kZWxBY3Rpb25zKVxuICB2YXIgcmVmQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgcmVmQ29udGFpbmVyLmNsYXNzTmFtZSA9ICd0cmVlZF9yZWZlcmVuY2VzJ1xuICByZWZDb250YWluZXIuaW5uZXJIVE1MID0gJzxoMSBjbGFzcz1cInRyZWVkX3JlZmVyZW5jZXNfdGl0bGVcIj5SZWZlcmVuY2VzPC9oMT4nXG4gIHRoaXMucmVmZXJlbmNlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIHRoaXMucmVmZXJlbmNlcy5jbGFzc05hbWUgPSAndHJlZWRfcmVmZXJlbmNlc19saXN0J1xuICB0aGlzLnJmcyA9IHt9XG4gIHJlZkNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnJlZmVyZW5jZXMpXG4gIHJvb3QuYXBwZW5kQ2hpbGQocmVmQ29udGFpbmVyKVxuICB0aGlzLnJlZkNvbnRhaW5lciA9IHJlZkNvbnRhaW5lclxuICByZXR1cm4gcm9vdFxufVxuXG5XRlZMLnByb3RvdHlwZS5zZXRSZWZlcmVuY2VzID0gZnVuY3Rpb24gKG5vZGVzLCBhY3Rpb24pIHtcbiAgdGhpcy5jbGVhclJlZmVyZW5jZXMoKVxuICBpZiAoIW5vZGVzIHx8ICFub2Rlcy5sZW5ndGgpIHtcbiAgICB0aGlzLnJlZkNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd0cmVlZF9yZWZlcmVuY2VzLS1zaG93bicpXG4gICAgcmV0dXJuXG4gIH1cbiAgdGhpcy5yZWZDb250YWluZXIuY2xhc3NMaXN0LmFkZCgndHJlZWRfcmVmZXJlbmNlcy0tc2hvd24nKVxuICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdGhpcy5hZGRSZWZlcmVuY2Uobm9kZSwgYWN0aW9uLmJpbmQobnVsbCwgbm9kZS5pZCkpXG4gIH0uYmluZCh0aGlzKSlcbn1cblxuV0ZWTC5wcm90b3R5cGUuY2xlYXJSZWZlcmVuY2VzID0gZnVuY3Rpb24gKCkge1xuICB3aGlsZSAodGhpcy5yZWZlcmVuY2VzLmxhc3RDaGlsZCkge1xuICAgIHRoaXMucmVmZXJlbmNlcy5yZW1vdmVDaGlsZCh0aGlzLnJlZmVyZW5jZXMubGFzdENoaWxkKVxuICB9XG4gIHRoaXMucmZzID0ge31cbn1cblxuV0ZWTC5wcm90b3R5cGUuYWRkUmVmZXJlbmNlID0gZnVuY3Rpb24gKG5vZGUsIGFjdGlvbikge1xuICB0aGlzLnJlZkNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd0cmVlZF9yZWZlcmVuY2VzLS1zaG93bicpXG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBkaXYuY2xhc3NOYW1lID0gJ3RyZWVkX3JlZmVyZW5jZSdcbiAgZGl2LmlubmVySFRNTCA9IG1hcmtlZChub2RlLmNvbnRlbnQpXG4gIGRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFjdGlvbilcbiAgdGhpcy5yZnNbbm9kZS5pZF0gPSBkaXZcbiAgdGhpcy5yZWZlcmVuY2VzLmFwcGVuZENoaWxkKGRpdilcbn1cblxuV0ZWTC5wcm90b3R5cGUucmVtb3ZlUmVmZXJlbmNlID0gZnVuY3Rpb24gKGlkLCByaWQpIHtcbiAgLy8gVE9ETyBmaWxsIHRoaXMgaW5cbn1cblxuIl19
(1)
});

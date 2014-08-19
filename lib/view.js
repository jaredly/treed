
var keyHandler = require('./key-handler')
  , normalActions = require('./normal-actions')
  , visualActions = require('./visual-actions')
  , util = require('./util')

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

var DomViewLayer = require('./dom-vl')
  , DefaultNode = require('./default-node')
  , DungeonsAndDragons = require('./dnd')
  , keys = require('./keys')
  , util = require('./util')
  , defaultKeys = require('./default-keys')

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


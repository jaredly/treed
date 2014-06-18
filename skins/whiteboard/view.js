
var DungeonsAndDragons = require('../../lib/dnd.js')

module.exports = View

function View(bindActions, model, ctrl, options) {
  this.mode = 'normal'
  this.active = null
  this.o = util.extend({
    Node: DefaultNode,
    ViewLayer: ViewLayer,
  }, options || {});
  // this.i.keybindingds = util.merge(this.default_keys, options.keys)
  // this.vl = new this.o.ViewLayer(this.o)
  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl
  this.dnd = new DungeonsAndDragons(this.vl, ctrl.actions.move.bind(ctrl))

  this.attachListeners()
}

View.prototype = {
  initialize: function (root) {
    var node = this.model.ids[root]
      , rootNode = this.vl.makeRoot()
    this.root = root
    this.populateChildren(root)
    this.selectSomething()
    return rootNode
  },

  rebase: function (newroot, trigger) {
    this.vl.clear()
    var root = this.vl.root
    this.initialize(newroot)
    this.vl.rebase(root)
    this.ctrl.trigger('rebase', newroot)
  },

  makeBlocks: function (root) {
    var children = this.model.ids[root].children
    if (!children) return
    children.forEach(this.makeBlock.bind(this));
  },

  makeBlock: function (id, i) {
    var node = this.model.ids[id]
      , config = node.meta.whiteboard
    if (!config) {
      config = {
        width: 200,
        height: 200,
        top: 10,
        left: i * 210
      }
    }
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

  getNode: function () {
    return this.vl.root
  }
}


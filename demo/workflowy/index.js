
var DefaultNode = require('./lib/default-node')
  , DomViewLayer = require('./lib/dom-vl')
  , View = require('./lib/view')
  , Controller = require('./lib/controller')
  , Model = require('./lib/model')
  , util = require('./lib/util')

module.exports = {
  Model: WFModel,
  Controller: WFController
}

function WFNode(data, options, isNew) {
  DefaultNode.call(this, data, options, isNew)
}

WFNode.prototype = Object.create(DefaultNode.prototype)
WFNode.prototype.constructor = WFNode

WFNode.prototype.setAttr = function (attr, value) {
  if (attr !== 'done') {
    DefaultNode.prototype.setAttr.call(this, attr, value)
    return
  }
  this.done = value
  if (value) {
    this.node.classList.add('listless__default-node--done')
  } else {
    this.node.classList.remove('listless__default-node--done')
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

function WFView() {
  View.apply(this, arguments)
}

WFView.prototype = Object.create(View.prototype)

WFView.prototype.extra_actions = {
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.ctrl.actions.clickBullet(this.selection[0])
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
      if (!this.selection.length) return
      var id = this.selection[0]
        , done = !this.model.ids[id].data.done
        , next = this.model.idBelow(id, this.root)
      if (next === undefined) next = id
      this.ctrl.actions.changed(this.selection[0], 'done', done)
      if (done) {
        this.goTo(next)
      }
    }
  }
}


function WFController(model, options) {
  options = util.merge({
    View: WFView,
    viewOptions: {
      ViewLayer: WFVL,
      node: WFNode
    },
    onBullet: function () {}
  }, options)
  Controller.call(this, model, options)
  this.o.onBullet(this.model.getLineage(model.root))
}

WFController.prototype = Object.create(Controller.prototype)

WFController.prototype.actions = util.extend({
  clickBullet: function (id) {
    if (id === 'new') return
    this.view.rebase(id)
    this.o.onBullet(this.model.getLineage(id))
  },
  backALevel: function () {
    var root = this.view.root
      , pid = this.model.ids[root].parent
    if (!this.model.ids[pid]) return
    this.actions.clickBullet(pid)
  }
}, Controller.prototype.actions)

function WFVL() {
  DomViewLayer.apply(this, arguments)
}

WFVL.prototype = Object.create(DomViewLayer.prototype)

WFVL.prototype.makeHead = function (body, actions) {
  var head = DomViewLayer.prototype.makeHead.call(this, body, actions)
    , bullet = document.createElement('div')
  bullet.classList.add('listless__bullet')
  bullet.addEventListener('mousedown', actions.clickBullet)
  head.insertBefore(bullet, head.childNodes[1])
  return head
}

function WFModel() {
  Model.apply(this, arguments)
}

WFModel.prototype = Object.create(Model.prototype)

WFModel.prototype.getLineage = function (id) {
  var lineage = []
  while (this.ids[id]) {
    lineage.unshift({
      name: this.ids[id].data.name,
      id: id
    })
    id = this.ids[id].parent
  }
  return lineage
}


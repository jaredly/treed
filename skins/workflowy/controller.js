
var Controller = require('../../lib/controller')
  , util = require('../../lib/util')

  , WFNode = require('./node')
  , WFView = require('./view')
  , WFVL = require('./vl')

module.exports = WFController

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


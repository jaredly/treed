
var Controller = require('../../lib/controller')
  , util = require('../../lib/util')

  , WFNode = require('./node')
  , WFView = require('./view')
  , WFVL = require('./vl')
  , commands = require('./commands')

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
  addTag: function (contents) {
    return this.executeCommands('addTag', [contents])[0];
  },
}, Controller.prototype.actions)


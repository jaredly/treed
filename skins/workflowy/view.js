
var View = require('../../lib/view')

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



var keys = require('../lib/keys')

module.exports = KeyManager

function KeyManager() {
  this._keyDown = this.keyDown.bind(this)
  this.keys = null
  this.store = null
  this.state = {}
  this.views = {}
}

KeyManager.prototype = {
  attach: function (store) {
    this.store = store
    store.on([
      store.events.activeViewChanged(),
      store.events.activeModeChanged()
    ], this.update.bind(this))
    this.update()
  },

  update: function () {
    if (!this.store.views[this.store.activeView]) return
    this.state = {
      active: this.store.activeView,
      mode: this.store.views[this.store.activeView].mode,
    }
  },

  addView: function (vid, keys) {
    this.views[vid] = keys
  },

  addKeys: function (config) {
    if (this.keys) return this.keys.add(config)
    this.keys = keys(config)
  },

  keyDown: function (e) {
    if (this.keys) {
      var res = this.keys(e)
      if (res !== true) return res
    }
    if (this.store) {
      this.views[this.state.active][this.state.mode](e)
    }
  },

  listen: function (window) {
    window.addEventListener('keydown', this._keyDown)
  },

  unlisten: function (window) {
    window.removeEventListener('keydown', this._keyDown)
  },
}


var merge = require('react/lib/merge')

module.exports = BaseStore

function BaseStore(options) {
  this._listeners = {}

  for (var name in this.actions) {
    this.actions[name] = this.actions[name].bind(this)
  }

  options.mixins.forEach((mixin) => {
    if (!mixin.store) return
    if (mixin.store.init) {
      mixin.store.init(this)
    }
    if (mixin.store.actions) {
      for (var name in mixin.store.actions) {
        this.actions[name] = mixin.store.actions[name].bind(this)
      }
    }
    for (var name in mixin.store) {
      if (name === 'actions' || name === 'init') continue;
      this[name] = mixin.store[name]
    }
  })
}

BaseStore.prototype = {
  actions: {},

  listenTo: function (actions) {
    for (var name in this.actions) {
      actions[name].listen(this.actions[name])
    }
  },

  listen: function (changes, listener) {
    for (var i=0; i<changes.length; i++) {
      if (!this._listeners[changes[i]]) {
        this._listeners[changes[i]] = [listener]
      } else {
        this._listeners[changes[i]].push(listener)
      }
    }
  },

  changed: function () {
    var what = [].slice.call(arguments)
    var touched = []
    for (var i=0; i<what.length; i++) {
      var listeners = this._listeners[what[i]]
      if (!listeners) continue;
      for (var j=0; j<listeners.length; j++) {
        if (called.indexOf(listeners[j]) !== -1) {
          continue // each listener should be called at most once per changed
        }
        listeners[j]()
        called.push(listeners[j])
      }
    }
  },
}


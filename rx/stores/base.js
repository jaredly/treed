
var Promise = require('bluebird')
var merge = require('react/lib/merge')

module.exports = BaseStore

function BaseStore(options) {
  this._listeners = {}

  for (var name in this.actions) {
    this.actions[name] = this.actions[name].bind(this)
  }

  if (options.plugins) {
    options.plugins.forEach(this.addPlugin.bind(this))
  }
}

BaseStore.prototype = {
  actions: {},

  addPlugin: function (plugin) {
    if (plugin.init) {
      plugin.init(this) // TODO async?
    }

    var name
    if (plugin.actions) {
      for (name in plugin.actions) {
        this.actions[name] = plugin.actions[name].bind(this)
      }
    }

    if (plugin.extend) {
      for (name in plugin.extend) {
        this[name] = plugin.extend[name]
      }
    }
  },

  on: function (changes, listener) {
    for (var i=0; i<changes.length; i++) {
      if (!this._listeners[changes[i]]) {
        this._listeners[changes[i]] = [listener]
      } else {
        this._listeners[changes[i]].push(listener)
      }
    }
  },

  off: function (changes, listener) {
    for (var i=0; i<changes.length; i++) {
      var ix = this._listeners[changes[i]].indexOf(listener)
      if (ix !== -1) {
        this._listeners[changes[i]].splice(ix, 1)
      }
    }
  },

  changed: function () {
    var what = [].slice.call(arguments)
    if (this._changed) {
      this._changed = this._changed.concat(what)
    } else {
      this._changed = what
      setTimeout(() => {
        this.emitChanged(this._changed)
        this._changed = null
      }, 0)
    }
  },

  emitChanged: function (what) {
    var called = []
    var promises = []
    for (var i=0; i<what.length; i++) {
      var listeners = this._listeners[what[i]]
      if (!listeners) continue;
      for (var j=0; j<listeners.length; j++) {
        if (called.indexOf(listeners[j]) !== -1) {
          continue; // each listener should be called at most once per changed
        }
        listeners[j]()
        var p = listeners[j]()
        if (p) {
          promises.push(p)
        }
        called.push(listeners[j])
      }
    }
    if (this._done_listener) {
      Promise.all(promises).then(this._done_listener)
    }
  },

  onDone: function (fn) {
    this._done_listener = fn
  },
}


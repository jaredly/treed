
var Promise = require('bluebird')
var merge = require('react/lib/merge')

module.exports = BaseStore

function BaseStore(options) {
  this._listeners = {}

  if (options.plugins) {
    options.plugins.forEach((plugin) => this.addPlugin(plugin, options.allPlugins))
  }
}

BaseStore.prototype = {
  actions: {},

  addPlugin: function (plugin, allPlugins) {
    if (plugin.init) {
      plugin.init(this) // TODO async?
    }

    var name
      , actions
    if (plugin.actions) {
      if ('function' === typeof plugin.actions) {
        actions = plugin.actions(allPlugins)
      } else {
        actions = plugin.actions
      }
      for (name in actions) {
        this.actions[name] = actions[name]
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
      } else if (this._listeners[changes[i]].indexOf(listener) === -1){
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
    if (what.length === 1 && Array.isArray(what[0])) {
      what = what[0]
    }
    if (this._changed) {
      this._changed = this._changed.concat(what)
    } else {
      this._changed = what
      setTimeout(() => {
        if (window.DEBUG_CHANGES) {
          console.log('emitting', this._changed)
        }
        var changes = this._changed
        this._changed = null
        this.emitChanged(changes)
      }, 0)
    }
    if (window.DEBUG_CHANGES) {
      console.log('changed', what)
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



import async from 'async'

var Promise = require('bluebird')

module.exports = BaseStore

function BaseStore(options) {
  this._listeners = {}
  this._plugin_teardowns = []

  if (options.actions) {
    for (var name in options.actions) {
      this.actions[name] = options.actions[name]
    }
  }

}

BaseStore.prototype = {
  actions: {},

  init(plugins, pluginConfig, done) {
    this.allPlugins = plugins || []
    if (!plugins) return done()
    const tasks = plugins
      // .map(plugin => plugin.store)
      // .filter(plugin => !!plugin)
      .map(plugin =>
           plugin.store &&
             this.addPlugin.bind(
              this, plugin.store,
              pluginConfig && pluginConfig[plugin.id]
            ))
      .filter(fn => !!fn)

    async.parallel(tasks, done)
  },

  teardown: function () {
    this._plugin_teardowns.forEach(fn => fn(this))
  },


  addPlugin: function (plugin, config, done) {
    if (plugin.teardown) {
      this._plugin_teardowns.push(plugin.teardown)
    }

    var name
      , actions
    if (plugin.actions) {
      if ('function' === typeof plugin.actions) {
        actions = plugin.actions(this.allPlugins)
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

    if (plugin.init) {
      plugin.init(this, config) // TODO async?
    } else if (plugin.asyncInit) {
      let timeout = setTimeout(() => {
        if (timeout !== null) {
          done(new Error('Plugin failed to initialize within 5 seconds'))
          timeout = null
        }
      }, 10000)
      return plugin.asyncInit(this, config, (err) => {
        if (timeout === null) {
          return
        }
        clearTimeout(timeout)
        timeout = null
        done(err)
      })
    }

    done()
  },

  on: function (changes, listener) {
    if ('string' === typeof changes) changes = [changes]
    for (var i=0; i<changes.length; i++) {
      if (!this._listeners[changes[i]]) {
        this._listeners[changes[i]] = [listener]
      } else if (this._listeners[changes[i]].indexOf(listener) === -1){
        this._listeners[changes[i]].push(listener)
      }
    }
  },

  off: function (changes, listener) {
    if ('string' === typeof changes) changes = [changes]
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


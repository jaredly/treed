/*
 * So this architecture opens up the possibility of doing multiple views, but
 * I'm not totally sure how to make it build naturally. I don't want multiple
 * mainstores. Also, I don't think a mixin would cut it. I think I'll need to
 * make a MultiViewStore that knows about multiple views, multiple "actives",
 * "selections", and "roots". And a view can register itself and say "hey I'm
 * a new view, I care about x".
 * 
 * But when an individual node wants to listen to a store, I don't want to
 * update it when a different view is getting a selection update. And so for
 * view specific updates (like active, selection, etc), I'll have the nodes
 * listen to a `node:<id>:view1` event. That seems like it would make sense.
 * But for now, with only one view, I can just overload the main `node:<id>`
 * event. Awesome
 */

var BaseStore = require('./base')
var extend = require('../util/extend')
var Commandeger = require('./commandeger')

module.exports = MainStore

function MainStore(options) {
  this.db = options.db

  this.clearViews()
  this._globals = {}

  BaseStore.apply(this, arguments)

  this.cmd = new Commandeger(
    this.changed.bind(this),
    (id, vid) => this.viewAction('setActive', vid, id),
    this.db,
    this._events
  )
}

MainStore.prototype = extend(Object.create(BaseStore.prototype), {
  constructor: MainStore,

  clearViews: function () {
    this.views = {}
    this._actions = {}
    this._events = {}
    if (this.cmd) {
      this.cmd.events = this._events
    }
    this._getters = {}
    this._nextViewId = 0
    this.activeView = 0
  },

  // create a proxy object for the store that is specific to a single view
  registerView: function () {
    var id = this._nextViewId++
    this.views[id] = {
      id: id,
      root: this.db.root,
      active: this.db.root,
      selected: null,
      editPos: null,
      mode: 'normal',
    }
    this._events[id] = extend({vid: id}, this.events)
    this._actions[id] = extend({
      view: this.views[id],
      db: this.db,
      events: this._events[id],
      changed: this.changed.bind(this),
      parent: this,
      globals: this._globals,
      startTransaction: () => this.cmd.startTransaction(),
      stopTransaction: () => this.cmd.stopTransaction(),
      executeCommand: (cmd, state, squash, done) => {
        if (arguments.length === 3 && 'function' === typeof squash) {
          done = squash
          squash = undefined
        }
        return this.cmd.execute({
          cmd,
          state,
          view: id,
          active: this.views[id].active,
          squash: squash,
          done: done,
        })
      },
      executeCommands: () => {
        var commands = []
        for (var i=0; i<arguments.length-1; i+=2) {
          commands.push({
            cmd: arguments[i],
            state: arguments[i+1],
            view: id,
            active: this.views[id].active
          })
        }
        if (arguments.length % 2 == 1) {
          commands[commands.length-1].done = arguments[arguments.length-1]
        }
        return this.cmd.executeCommands.apply(this.cmd, commands)
      },
    }, this.actions)
    this._getters[id] = extend({
      view: this.views[id],
      globals: this._globals,
      parent: this,
      db: this.db,
    }, this.getters)

    this.activeView = id

    return {
      id,
      view: this.views[id],
      actions: this._actions[id],
      getters: this._getters[id],
      events: this._events[id],
      globals: this._globals,
      on: this.on.bind(this),
      off: this.off.bind(this),
    }
  },

  // just the `store` part of the plugin
  addPlugin: function (plugin, allPlugins) {
    BaseStore.prototype.addPlugin.call(this, plugin, allPlugins)

    if (plugin.getters) {
      for (var name in plugin.getters) {
        this.getters[name] = plugin.getters[name]
      }
    }
    if (plugin.events) {
      for (var name in plugin.events) {
        this.events[name] = plugin.events[name]
      }
    }
    if (plugin.commands) {
      this.cmds.addCommands(plugin.commands)
    }
  },

  viewAction: function (name, id, ...args) {
    return this._actions[id][name].apply(this._actions[id], args)
  },

  events: {
    nodeChanged: (id) => 'node:' + id,
    nodeViewChanged: function (id) { return this.nodeChanged(id) + ':view:' + this.vid },

    activeViewChanged: () => 'active-view',
    rootChanged: function () { return 'root:' + this.vid },
    modeChanged: function () { return 'mode:' + this.vid },
  },

  actions: require('./actions'),

  // same deal as actions
  getters: {
    getNode: function (id) {
      return this.db.nodes[id]
    },

    isActiveView: function () {
      return this.view.id === this.parent.activeView
    },

    isActive: function (id) {
      return id === this.view.active
    },

    isSelected: function (id) {
      return this.view.selection && this.view.selection.indexOf(id) !== -1
    },

    editState: function (id) {
      var editing = this.view.mode === 'insert' && id === this.view.active
      return editing && this.view.editPos
    },
  }
})


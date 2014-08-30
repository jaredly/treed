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
var movement = require('../util/movement')
var extend = require('../util/extend')

module.exports = MainStore

function MainStore(options) {
  BaseStore.apply(this, arguments)

  this.pl = options.pl

  this.views = {}
  this._nextViewId = 0
}

MainStore.prototype = extend(Object.create(BaseStore.prototype), {
  constructor: MainStore,

  registerView: function () {
    var id = this._nextViewId++
    this.views[id] = {
      id: id,
      root: this.pl.root,
      active: this.root,
      selected: null,
      editPos: null,
      mode: 'normal',
    }
    return id
  },

  // just the `store` part of the plugin
  addPlugin: function (plugin) {
    BaseStore.prototype.addPlugin.call(this, plugin)

    if (plugin.commands) {
      this.cmds.addCommands(plugin.commands)
    }
  },

  viewActions: function (id) {
    var actions = {}
    Object.keys(this.actions).forEach(name => {
      var action = this.actions[name]
      actions[name] = (args) =>
        action.call(this, args, this.views[id], (cmd, state) =>
          this.cmd.execute({
            cmd,
            state,
            view: id,
            active: this.views[id].active
          }, this.events)
        )
    })
    return actions
  },

  events: {
    nodeChanged: (id) => 'node:' + id,
    nodeViewChanged: (vid, id) => 'node:' + id + ':view:' + vid,

    rootChanged: (vid) => 'root:' + vid,
    modeChanged: (vid) => 'mode:' + vid,
  },

  actions: require('./actions'),

  getters: {
    getNode: function (id) {
      return this.pl.nodes[id]
    },

    isActive: function (id) {
      return id === this.active
    },

    isSelected: function (id) {
      return this.selection && this.selection.indexOf(id) !== -1
    },

    editState: function (id) {
      var editing = this.mode === 'insert' && id === this.active
      return editing && this.editPos
    },
  }
})


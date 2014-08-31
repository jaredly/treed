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

/** don't need this atm actually
function bindExtend(base, other) {
  for (var name in other) {
    if ('function' !== typeof other[name]) {
      base[name] = other[name]
      continue
    }
    base[name] = other[name].bind(base)
  }
}
*/

function MainStore(options) {
  BaseStore.apply(this, arguments)

  this.pl = options.pl

  this.views = {}
  this._actions = {}
  this._events = {}
  this._getters = {}
  this._nextViewId = 0
  this.activeView = 0

  this.cmd = new Commandeger(
    this.changed.bind(this),
    (id, vid) => this.viewActive('setActive', {id}, vid),
    this.pl,
    this._events
  )
}

MainStore.prototype = extend(Object.create(BaseStore.prototype), {
  constructor: MainStore,

  // create a proxy object for the store that is specific to a single view
  registerView: function () {
    var id = this._nextViewId++
    this.views[id] = {
      id: id,
      root: this.pl.root,
      active: this.pl.root,
      selected: null,
      editPos: null,
      mode: 'normal',
    }
    this._events[id] = extend({vid: id}, this.events)
    this._actions[id] = extend({
      view: this.views[id],
      nodes: this.pl.nodes,
      events: this._events[id],
      changed: this.changed.bind(this),
      parent: this,
      executeCommand: (cmd, state) =>
        this.cmd.execute({
          cmd,
          state,
          view: id,
          active: this.views[id].active
        })
    }, this.actions)
    this._getters[id] = extend({
      parent: this,
      view: this.views[id],
      nodes: this.pl.nodes,
    }, this.getters)

    this.activeView = id

    return {
      id,
      view: this.views[id],
      actions: this._actions[id],
      getters: this._getters[id],
      events: this._events[id],
      on: this.on.bind(this),
      off: this.off.bind(this),
    }
  },

  // just the `store` part of the plugin
  addPlugin: function (plugin) {
    BaseStore.prototype.addPlugin.call(this, plugin)

    if (plugin.commands) {
      this.cmds.addCommands(plugin.commands)
    }
  },

  viewAction: function (name, args, id) {
    return this._actions[id][name](args)
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
      return this.nodes[id]
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


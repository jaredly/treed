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
  BaseStore.call(this, arguments)

  this.pl = options.pl
  this.history = []
  this.histpos = 0

  // view stuff
  this.root = this.pl.root
  this.active = this.root
  this.selected = null
  this.mode = 'normal'
}

MainStore.prototype = extend(Object.create(BaseStore.prototype), {
  constructor: MainStore,

  // just the `store` part of the mixin
  addMixin: function (mixin) {
    BaseStore.prototype.addMixin.call(this, mixin, ['commands'])
    for (var name in mixin.commands) {
      this.commands[name] = mixin.commands[name]
    }
  },

  commands: {

    set: {
      args: ['id', 'attr', 'value'],
      apply: function (pl) {
        this.old = pl.nodes[this.id][this.attr]
        pl.set(this.id, this.attr, this.value)
        return 'node:' + this.id
      },
      undo: function (pl) {
        pl.set(this.id, this.attr, this.old)
        return 'node:' + this.id
      },
    },

    batchSet: {
      args: ['attr', 'ids', 'values'],
      apply: function (pl) {
        this.old = this.ids.map((id) => pl.nodes[id][this.attr])
        pl.batchSet(this.attr, this.ids, this.values)
        return this.ids.map((id) => 'node:' + id)
      },
      undo: function (pl) {
        pl.batchSet(this.attr, this.ids, this.old)
        return this.ids.map((id) => 'node:' + id)
      },
    },

  },

  executeCommands: function () {
    var changed = []
    var changeset = []
    var time = Date.now()
    var command
    for (var i=0; i<arguments.length; i+=2) {
      command = this.doCommand(arguments[i], arguments[i+1])
      changeset.push(command)
      changed = changed.concat(command.changed)
    }
    this.history.push({time: time, changes: changeset})
    this.histpos = this.history.length
    this.changed.apply(this, changed)
  },

  doCommand: function (name, object) {
    var changed = this.commands[name].apply.call(object, this.pl)
    if ('string' === typeof changed) {
      changed = [changed]
    }
    return {name: name, state: object, changed: changed}
  },

  undoCommand: function (command) {
    var changed = this.commands[command.name].undo.call(command, this.pl)
    if ('string' === typeof changed) {
      changed = [changed]
    }
    return changed
  },

  getNode: function (id) {
    return this.pl.nodes[id]
    /*
    // TODO could optimize?
    var node = _.cloneDeep(this.pl.nodes[id])
    if (id === this.active) {
      node.active = true
    }
    if (this.selection && this.selection.indexOf(id) !== -1) {
      node.selected = true
    }
    return node
    */
  },

  isActive: function (id) {
    return id === this.active
  },

  isSelected: function (id) {
    return this.selection && this.selection.indexOf(id) !== -1
  },

  isEditing: function (id) {
    return this.mode === 'insert' && id === this.active
  },

  actions: {
    set: function (id, attr, value) {
      this.executeCommands('set', {id: id, attr: attr, value: value})
    },

    batchSet: function (attr, ids, values) {
      this.executeCommands('batchSet', {ids: ids, attr: attr, values: values})
    },

    // TODO should I verify here that it's displayable? that it's rendered
    // under the current root?
    setActive: function (id) {
      if (!id) return
      var old = this.active
      this.active = id
      this.changed('node:' + old, 'node:' + id)
    },

    startEditing: function (id) {
      this.mode = 'insert'
      var old = this.active
      this.active = id
      this.changed('node:' + old, 'node:' + id, 'mode')
    },

    stopEditing: function (id) {
      this.mode = 'normal'
      this.changed('node:' + id, 'mode')
    },

    // TODO: put these in a mixin, b/c they only apply to the treelist view?
    // this would be the same mixin that does collapsability? Or maybe there
    // would be a simplified one that doesn't know about collapsibility. Seems
    // like there would be some duplication
    goUp: function () {
      this.actions.setActive(movement.up(this.active, this.root, this.pl.nodes))
    },

    goDown: function () {
      this.actions.setActive(movement.down(this.active, this.root, this.pl.nodes))
    },

    goLeft: function () {
      this.actions.setActive(movement.left(this.active, this.root, this.pl.nodes))
    },

    goRight: function () {
      this.actions.setActive(movement.right(this.active, this.root, this.pl.nodes))
    },

  }
})


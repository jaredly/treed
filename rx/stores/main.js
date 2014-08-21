
var BaseStore = require('./base')

module.exports = MainStore

function MainStore(options) {
  BaseStore.call(this, arguments)

  this.pl = options.pl
  this.root = this.pl.root
  this.active = this.pl.root
  this.selected = null
  this.cmd = new Commandeger(this.pl, this.change)
}

MainStore.prototype = merge(Object.create(BaseStore.prototype), {
  constructor: MainStore,

  commands: {

    set: {
      args: ['id', 'attr', 'value'],
      apply: function (pl) {
        this.old = pl.nodes[this.id][this.attr]
        pl.set(this.id, this.attr, this.value)
        return 'node:' + id
      },
      undo: function (pl) {
        pl.set(this.id, this.attr, this.old)
        return 'node:' + id
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
    // TODO could optimize?
    var node = _.cloneDeep(this.pl.nodes[id])
    if (id === this.active) {
      node.active = true
    }
    if (this.selection && this.selection.indexOf(id) !== -1) {
      node.selected = true
    }
    return node
  },

  actions: {
    set: function (id, attr, value) {
      this.executeCommands('set', {id: id, attr: attr, value: value})
    },

    batchSet: function (attr, ids, values) {
      this.executeCommands('batchSet', {ids: ids, attr: attr, values: values})
    },

    setActive: function (id) {
      if (!id) return
      var old = this.active
      this.active = id
      this.changed('node:' + old, 'node:' + id)
    },

    goUp: function () {
      this.setActive(movement.up(this.active, this.root, this.pl.nodes))
    },

    goDown: function () {
      this.setActive(movement.down(this.active, this.root, this.pl.nodes))
    },

    goLeft: function () {
      this.setActive(movement.left(this.active, this.root, this.pl.nodes))
    },

    goRight: function () {
      this.setActive(movement.right(this.active, this.root, this.pl.nodes))
    },

  }
})


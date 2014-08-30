
module.exports = Commandeger

/**
 * Things we need
 * - view
 * - pl
 */

function Commandeger(commands) {
  this.history = []
  this.histpos = 0
}

Commandeger.prototype = {

  commands: require('./commands'),

  addCommands: function (commands) {
    for (var name in commands) {
      this.commands[name] = commands[name]
    }
  },

  execute: function (command) {
    return this.executeCommands(command)[0]
  },

  executeCommands: function (...commands) {
    var time = Date.now()
    var changed = []
    var states = commands.map((command) => {
      changed = changed.concat(this.doCommand(command))
      return command.state
    })
    this.history = this.history.slice(0, this.histpos)
    this.history.push({time: time, changes: changeset})
    this.histpos = this.history.length
    this.changed.apply(this, changed)
    return states
  },

  undoCommands: function () {
    if (this.histpos <= 0) return
    this.histpos -= 1
    var last = this.history[this.histpos]
    var changed = []
    var time = Date.now()
    var changes
    for (var i=0; i<last.changes.length; i++) {
      changes = this.undoCommand(last.changes[i])
      changed = changed.concat(changes)
    }
    // XXX
    this.changed.apply(this, changed)
  },

  redoCommands: function () {
    if (this.histpos >= this.history.length) return
    var last = this.history[this.histpos]
    this.histpos += 1
    var changed = []
    var time = Date.now()
    var changes
    for (var i=0; i<last.changes.length; i++) {
      changes = this.redoCommand(last.changes[i])
      changed = changed.concat(changes)
    }
    // XXX
    this.changed.apply(this, changed)
  },

  doCommand: function (command) {
    var changed = this.commands[name].apply.call(command.state, this.pl)
    if ('string' === typeof changed) {
      changed = [changed]
    }
    return changed
  },

  undoCommand: function (command) {
    var changed = this.commands[command.name].undo.call(command.state, this.pl)
    if ('string' === typeof changed) {
      changed = [changed]
    }
    if (this.pl.nodes[command.active]) {
      // XXX
      this.actions.setActive({id: command.active}, this.views[command.view])
    }
    return changed
  },

  redoCommand: function (command) {
    var cmd = this.commands[command.name]
    var action = cmd.redo || cmd.apply
    var changed = action.call(command.state, this.pl)
    if ('string' === typeof changed) {
      changed = [changed]
    }
    // XXX
    this.actions.setActive({id: command.active}, this.views[command.view])
    return changed
  },
}


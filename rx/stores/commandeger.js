
module.exports = Commandeger

/**
 * Things we need
 * - view
 * - db
 */

function Commandeger(changed, setActive, db, events) {
  this.history = []
  this.histpos = 0
  this.changed = changed
  this.setActive = setActive
  this.events = events
  this.db = db
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
    var squash = false
    var states = commands.map((command) => {
      changed = changed.concat(this.doCommand(command))
      squash = squash || command.squash
      return command.state
    })
    if (squash) {
      if (this.histpos > 0) {
        var past = this.history[this.histpos - 1]
        past.changes = past.changes.concat(commands)
      }
    } else {
      this.history = this.history.slice(0, this.histpos)
      this.history.push({time: time, changes: commands})
      this.histpos = this.history.length
    }
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
    for (var i=last.changes.length-1; i >= 0; i--) {
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
    this.changed.apply(this, changed)
  },

  doCommand: function (command) {
    var changed = this.commands[command.cmd].apply.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    return changed
  },

  undoCommand: function (command) {
    var changed = this.commands[command.cmd].undo.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    this.setActive(command.active, command.view)
    return changed
  },

  redoCommand: function (command) {
    var cmd = this.commands[command.cmd]
    var action = cmd.redo || cmd.apply
    var changed = action.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    this.setActive(command.active, command.view)
    return changed
  },
}


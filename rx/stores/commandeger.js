
var async = require('async')

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
  this._transaction_ix = null
  this._transactioning = 0
  this.db = db
}

Commandeger.prototype = {

  commands: require('./commands'),

  addCommands: function (commands) {
    for (var name in commands) {
      this.commands[name] = commands[name]
    }
  },

  startTransaction: function () {
    if (!this._transactioning) {
      this._transaction_ix = null
    }
    this._transactioning += 1
  },

  stopTransaction: function () {
    this._transactioning -= 1
    if (!this._transactioning) {
      this._transaction_ix = null
    }
  },

  execute: function (command) {
    return this.executeCommands(command)
  },

  executeCommands: function (...commands) {
    var time = Date.now()
    var changed = ['changed']
    var squash = null
    if (null !== this._transaction_ix) {
      squash = this._transaction_ix
    } else {
      commands.some(cmd => {
        if ('number' == typeof cmd.squash) {
          squash = cmd.squash
          return true
        }
      })
    }
    if ('number' == typeof squash) {
      var past = this.history[squash]
      past.changes = past.changes.concat(commands)
    } else {
      this.history = this.history.slice(0, this.histpos)
      this.history.push({time: time, changes: commands})
      this.histpos = this.history.length
      if (this._transactioning) {
        this._transaction_ix = this.histpos - 1
      }
    }
    async.mapSeries(commands, (command, next) => {
      this.doCommand(command, (err, newChanged) => {
        changed = changed.concat(newChanged)
        next(err, command.state)
      })
    }, (err, states) => {
      if (err) return console.error('Failed to execute commands!!!', err)
      this.changed.apply(this, changed)
    })
    if (squash !== null) return squash
    return this.histpos - 1
  },

  undoCommands: function () {
    if (this.histpos <= 0) return
    this.histpos -= 1
    var last = this.history[this.histpos]
    var changed = ['changed']
    var time = Date.now()
    var items = []
    for (var i=last.changes.length-1; i >= 0; i--) {
      items.push(last.changes[i])
    }
    async.mapSeries(items, (item, next) => {
      this.undoCommand(item, (err, newChanges) => {
        changed = changed.concat(newChanges)
        next()
      })
    }, (err) => this.changed.apply(this, changed))
  },

  redoCommands: function () {
    if (this.histpos >= this.history.length) return
    var last = this.history[this.histpos]
    this.histpos += 1
    var changed = ['changed']
    var time = Date.now()
    async.mapSeries(last.changes, (item, next) => {
      this.redoCommand(item, (err, changes) => {
        changed = changed.concat(changes)
        next()
      })
    }, (err) => this.changed.apply(this, changed))
  },

  doCommand: function (command, done) {
    var cmd = this.commands[command.cmd]
    if (cmd.async) {
      cmd.apply.call(command.state, this.db, this.events[command.view], (err, changed) => {
        if ('string' === typeof changed) {
          changed = [changed]
        }
        if (command.done) {
          command.done(null, command.state)
        }
        done(err, changed)
      })
      return
    }
    var changed = cmd.apply.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    if (command.done) {
      command.done(null, command.state)
    }
    done(null, changed)
  },

  undoCommand: function (command, done) {
    var cmd = this.commands[command.cmd]
    if (cmd.async) {
      cmd.undo.call(command.state, this.db, this.events[command.view], (err, changed) => {
        if ('string' === typeof changed) {
          changed = [changed]
        }
        done(err, changed)
      })
      return
    }
    var changed = cmd.undo.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    this.setActive(command.active, command.view)
    done(null, changed)
  },

  redoCommand: function (command, done) {
    var cmd = this.commands[command.cmd]
    var action = cmd.redo || cmd.apply
    if (cmd.async) {
      action.call(command.state, this.db, this.events[command.view], (err, changed) => {
        if ('string' === typeof changed) {
          changed = [changed]
        }
        done(err, changed)
      })
      return
    }
    var changed = action.call(command.state, this.db, this.events[command.view])
    if ('string' === typeof changed) {
      changed = [changed]
    }
    this.setActive(command.active, command.view)
    done(null, changed)
  },
}


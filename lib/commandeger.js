
var commands = require('./commands')

module.exports = Commandeger

function makeCommand(type, args) {
  var names = commands[type].args
    , data = {}
  for (var i=0; i<names.length; i++) {
    data[names[i]] = args[i]
  }
  return {type: type, data: data}
}

/**
 * Manages the execution of commands.
 */
function Commandeger(model) {
  this.commands = []
  this.histpos = 0
  this.view = null
  this.listeners = {}
  this.working = false
  this.model = model
}

Commandeger.prototype = {
  /**
   * Execute one or more comments.
   *
   * Usage:
   *
   * - executeCommands('cmdtype', [args, etc])
   * - executeCommands('cmdtype', [args, etc], 'nother', [more, args])
   *
   * @param {string} type the command to execute
   * @param {list} args a list of args to pass to the comment
   */
  executeCommands: function (type, args) {
    if (this.working) return
    var cmds = [];
    var i
    for (i=0; i<arguments.length; i+=2) {
      cmds.push(makeCommand(arguments[i], arguments[i+1]))
    }
    if (this.histpos > 0) {
      this.commands = this.commands.slice(0, -this.histpos)
      this.histpos = 0
    }
    this.commands.push(cmds)
    for (i=0; i<cmds.length; i++) {
      this.doCommand(cmds[i])
    }
    this.trigger('change')
  },

  /**
   * Trigger an event on listeners
   *
   * @param {string} what the event to trigger
   */
  trigger: function (what) {
    var rest = [].slice.call(arguments, 1)
    for (var item in this.listeners[what]) {
      this.listeners[what][item].apply(null, rest)
    }
  },

  /**
   * Register a listener for an event
   *
   * @param {string} what the event type
   * @param {fn} cb the event handler function
   */
  on: function (what, cb) {
    if (!this.listeners[what]) {
      this.listeners[what] = []
    }
    this.listeners[what].push(cb)
  },

  /**
   * Undo the most recent change, if possible.
   *
   * If history is empty, nothing happens.
   *
   * @return {bool} whether anything actually happened
   */
  undo: function () {
    document.activeElement.blur()
    var pos = this.histpos ? this.histpos + 1 : 1
      , ix = this.commands.length - pos
    if (ix < 0) {
      return false // no more undo!
    }
    var cmds = this.commands[ix]
    for (var i=cmds.length-1; i>=0; i--) {
      this.undoCommand(cmds[i])
    }
    this.histpos += 1
    this.trigger('change')
    return true
  },

  /**
   * Redo the most recent undo, if any
   *
   * @return {bool} whether anothing was redone
   */
  redo: function () {
    var pos = this.histpos ? this.histpos - 1 : -1
      , ix = this.commands.length - 1 - pos
    if (ix >= this.commands.length) {
      return false // no more to redo!
    }
    var cmds = this.commands[ix]
    for (var i=0; i<cmds.length; i++) {
      this.redoCommand(cmds[i])
    }
    this.histpos -= 1
    this.trigger('change')
    return true
  },

  // privatish things
  setView: function (view) {
    this.view = view
  },

  doCommand: function (cmd) {
    this.working = true
    commands[cmd.type].apply.call(cmd.data, this.view, this.model)
    this.working = false
  },

  undoCommand: function (cmd) {
    this.working = true
    commands[cmd.type].undo.call(cmd.data, this.view, this.model)
    this.working = false
  },

  redoCommand: function (cmd) {
    this.working = true
    var c = commands[cmd.type]
    ;(c.redo || c.apply).call(cmd.data, this.view, this.model)
    this.working = false
  },
}



module.exports = BaseNode

var keys = require('./keys')
  , util = require('./util')

function BaseNode(content, meta, options, isNew, modelActions) {
  this.content = content || ''
  this.isNew = isNew
  this.modelActions = modelActions
  this.o = options
  this.o.keybindings = util.merge(this.default_keys, options.keys)

  this.editing = false
  this.setupNode();
}

BaseNode.addAction = function (action, binding, func) {
  if (!this.extra_actions) {
    this.extra_actions = {}
  }
  this.extra_actions[action] = {
    binding: binding,
    func: func
  }
}

BaseNode.prototype = {
  // public
  startEditing: function (fromStart) {
  },

  stopEditing: function () {
  },

  addEditText: function (text) {
  },

  setMeta: function (meta) {
  },

  setAttr: function (attr, value) {
  },

  // protexted
  isAtStart: function () {
  },

  isAtEnd: function () {
  },

  isAtBottom: function () {
  },

  isAtTop: function () {
  },

  setupNode: function () {
  },

  setInputValue: function (value) {
  },

  getInputValue: function () {
  },

  setTextContent: function (value) {
  },

  getSelectionPosition: function () {
  },

  // Should there be a canStopEditing?
  focus: function () {
    this.startEditing();
  },

  blur: function () {
    this.stopEditing();
  },

  keyHandler: function () {
    var actions = {}
      , action
    for (action in this.o.keybindings) {
      actions[this.o.keybindings[action]] = this.actions[action]
    }

    if (this.extra_actions) {
      for (action in this.extra_actions) {
        if (!actions[action]) {
          actions[this.extra_actions[action].binding] = this.extra_actions[action].action
        }
      }
    }

    return keys(actions).bind(this)
  },

  default_keys: {
    'undo': 'ctrl+z',
    'redo': 'ctrl+shift+z',
    'collapse': 'alt+left',
    'uncollapse': 'alt+right',
    'dedent': 'shift+tab, shift+alt+left',
    'indent': 'tab, shift+alt+right',
    'move up': 'shift+alt+up',
    'move down': 'shift+alt+down',
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right',
    'add after': 'return',
    'insert return': 'shift+return',
    'merge up': 'backspace',
    'stop editing': 'escape',
  },

  actions: {
    'undo': function () {
      this.o.undo()
    },

    'redo': function () {
      this.o.redo()
    },

    'collapse': function () {
      this.o.toggleCollapse(true)
    },

    'uncollapse': function () {
      this.o.toggleCollapse(false)
    },

    'dedent': function () {
      this.o.moveLeft()
    },

    'indent': function () {
      this.o.moveRight()
    },

    'move up': function () {
      this.o.moveUp()
    },

    'move down': function () {
      this.o.moveDown()
    },

    'up': function () {
      if (this.isAtTop()) {
        this.o.goUp();
      } else {
        return true
      }
    },

    'down': function () {
      if (this.isAtBottom()) {
        this.o.goDown()
      } else {
        return true
      }
    },

    'left': function () {
      if (this.isAtStart()) {
        return this.o.goUp()
      }
      return true
    },

    'right': function () {
      if (this.isAtEnd()) {
        return this.o.goDown(true)
      }
      return true
    },

    'insert return': function (e) {
      return true
    },

    'add after': function () {
      var ss = this.getSelectionPosition()
        , content = this.getVisibleValue()
        , rest = null
      if (this.isMultiLine()) {
        return true
      }
      var rest = this.splitRightOfCursor()
      if (!this.isNew) {
        this.stopEditing()
      }
      this.o.addAfter(rest, true)
    },

    // on backspace
    'merge up': function () {
      var value = this.getInputValue()
      if (!value) {
        return this.o.remove()
      }
      if (!this.isMultiLine() && this.isAtStart()) {
        return this.o.remove(value)
      }
      return true
    },

    'stop editing': function () {
      this.stopEditing();
    }
  },
}


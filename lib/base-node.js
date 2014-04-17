
function BaseNode(data, options) {
  this.name = data.name
  this.o = options
  this.o.keybindings = merge(this.default_keys, options.keys)

  this.editing = false
  this.setupNode();
}

BaseNode.addAction = function (name, binding, func) {
  if (!this.extra_actions) {
    this.extra_actions = {}
  }
  this.extra_actions[name] = {
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
  setData: function (data) {
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
    for (var name in this.o.keybindings) {
      actions[this.o.keybindings[name]] = this.actions[name]
    }

    if (this.extra_actions) {
      for (var name in this.extra_actions) {
        if (!actions[name]) {
          actions[this.extra_actions[name].binding] = this.extra_actions[name].action
        }
      }
    }

    return keys(actions).bind(this)
  },


  default_keys: {
    'undo': 'ctrl z',
    'redo': 'ctrl shift z',
    'collapse': 'alt left',
    'uncollapse': 'alt right',
    'dedent': 'shift tab, shift alt left',
    'indent': 'tab, shift alt right',
    'move up': 'shift alt up',
    'move down': 'shift alt down',
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right',
    'add after': 'return',
    'insert return': 'shift return',
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
        , name = this.getInputValue()
        , rest = null
      if (name.indexOf('\n') !== -1) {
        return true
      }
      if (ss < name.length) {
        rest = name.slice(ss)
        this.name = name.slice(0, ss)
        this.setInputValue(this.name)
        this.setTextContent(this.name)
      }
      this.blur()
      this.o.addAfter(rest)
    },
    // on backspace
    'merge up': function () {
      var value = this.getInputValue()
      if (!value) {
        return this.o.remove()
      }
      if (this.isAtStart()) {
        return this.o.remove(value)
      }
      return true
    },
    'stop editing': function () {
      this.stopEditing();
    }
  },
}


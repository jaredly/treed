
var KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  27: 'escape',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  65: 'a',
  66: 'b',
  67: 'c',
  68: 'd',
  72: 'h',
  73: 'i',
  74: 'j',
  75: 'k',
  76: 'l',
  77: 'm',
  78: 'n',
  79: 'o',
  80: 'p',
  81: 'q',
  82: 'r',
  83: 's',
  84: 't',
  85: 'u',
  86: 'v',
  87: 'w',
  88: 'x',
  89: 'y',
  90: 'z',
  113: 'f2',
  219: '[',
  221: ']'
}

function keys(keys) {
  var kmap = {}
    , parts
  for (var name in keys) {
    parts = name.split(',')
    for (var i=0;i<parts.length;i++) {
      kmap[parts[i].trim()] = keys[name]
    }
  }
  return function (e) {
    if (!KEYS[e.keyCode]) {
      return console.log(e.keyCode)
    }
    var name = KEYS[e.keyCode]
    if (e.altKey) name = 'alt ' + name
    if (e.shiftKey) name = 'shift ' + name
    if (e.ctrlKey) name = 'ctrl ' + name
    if (!kmap[name]) return
    if (kmap[name].call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }
}

function DefaultNode(data, options) {
  this.name = data.name
  this.o = options

  this.editing = false
  this.setupNode();
}


DefaultNode.prototype = {
  // Should there be a canStopEditing?
  focus: function () {
    this.startEditing();
  },
  blur: function () {
    this.stopEditing();
  },
  addEditText: function (text) {
    var pl = this.name.length
    this.editing = true;
    this.name += text
    this.input.value = this.name;
    this.text.innerText = this.name;
    this.node.replaceChild(this.input, this.text)
    // this.input.focus();
    this.o.setEditing();
    this.input.selectionStart = this.input.selectionEnd = pl;
  },
  setData: function (data) {
    if (data.name === this.name) return
    this.name = data.name
    this.input.value = data.name
    this.text.innerText = data.name
  },
  setupNode: function () {
    this.node = document.createElement('div')
    this.input = document.createElement('input')
    this.text = document.createElement('div')
    this.node.classList.add('listless__default-node')

    this.text.innerText = this.name
    this.node.appendChild(this.text)
    this.registerListeners();
  },
  startEditing: function (fromStart) {
    if (this.editing) return
    this.editing = true;
    this.input.value = this.name;
    this.node.replaceChild(this.input, this.text)
    this.input.focus();
    if (fromStart) {
      this.input.selectionStart = this.input.selectionEnd = 0;
    } else {
      this.input.selectionStart = this.input.selectionEnd = this.name.length;
    }
    this.o.setEditing()
  },
  stopEditing: function () {
    if (!this.editing) return
    if (this.name != this.input.value) {
      this.text.innerText = this.input.value
      this.name = this.input.value
      this.o.changed('name', this.name)
    }
    this.editing = false
    this.node.replaceChild(this.text, this.input)
    this.o.doneEditing();
  },
  registerListeners: function () {
    this.text.addEventListener('mousedown', function (e) {
      this.startEditing();
      e.preventDefault()
      return false
    }.bind(this))

    this.input.addEventListener('blur', function (e) {
      this.stopEditing();
      e.preventDefault()
      return false
    }.bind(this));

    var keyHandler = keys({
      'ctrl z': function () {
        this.o.undo()
      },
      'ctrl shift z': function () {
        this.o.redo()
      },
      'alt left': function () {
        this.o.toggleCollapse(true)
      },
      'alt right': function () {
        this.o.toggleCollapse(false)
      },
      'shift tab, shift alt left': function () {
        this.o.moveLeft()
      },
      'tab, shift alt right': function () {
        this.o.moveRight()
      },
      'shift alt up': function () {
        this.o.moveUp()
      },
      'shift alt down': function () {
        this.o.moveDown()
      },
      up: function () {
        this.o.goUp();
      },
      down: function () {
        this.o.goDown()
      },
      left: function () {
        var ss = this.input.selectionStart
        if (ss === 0) {
          return this.o.goUp()
        }
        return true
      },
      right: function () {
        var ss = this.input.selectionStart
        if (ss === this.input.value.length) {
          return this.o.goDown(true)
        }
        return true
      },
      'return': function () {
        var ss = this.input.selectionStart
          , name = this.input.value
          , rest = null
        if (ss < name.length) {
          rest = name.slice(ss)
          this.name = name.slice(0, ss)
          this.input.value = this.name
          this.text.innerText = this.name
        }
        this.blur()
        this.o.addAfter(rest)
      },
      backspace: function () {
        if (!this.input.value) {
          return this.o.remove()
        }
        if (this.input.selectionStart == this.input.selectionEnd && this.input.selectionStart === 0) {
          return this.o.remove(this.input.value)
        }
        return true
      },
      escape: function () {
        this.stopEditing();
      }
    }).bind(this)

    this.input.addEventListener('keydown', function (e) {
      // console.log(e.keyCode);
      return keyHandler(e)
    }.bind(this))

  }
}


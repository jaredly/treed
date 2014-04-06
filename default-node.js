
var KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete'
}

function keys(keys) {
  return function (e) {
    if (!KEYS[e.keyCode]) {
      return
    }
    var name = KEYS[e.keyCode]
    if (e.ctrlKey) name = 'ctrl ' + name
    if (e.shiftKey) name = 'shift ' + name
    if (e.altKey) name = 'alt ' + name
    if (!keys[name]) return
    if (keys[name].call(this, e) !== true) {
      e.preventDefault()
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
    this.input.focus();
    this.input.selectionStart = this.input.selectionEnd = pl;
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
  },
  stopEditing: function () {
    if (!this.editing) return
    this.editing = false
    if (this.name != this.input.value) {
      this.text.innerText = this.input.value
      this.name = this.input.value
      this.o.changed('name', this.name)
    }
    this.node.replaceChild(this.text, this.input)
  },
  registerListeners: function () {
    this.node.addEventListener('click', function (e) {
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
      'alt left': function () {
        this.o.toggleCollapse(true)
      },
      'alt right': function () {
        this.o.toggleCollapse(false)
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
      'shift tab': function (e) {
      },
      tab: function (e) {
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
      }
    }).bind(this)

    this.input.addEventListener('keydown', function (e) {
      console.log(e.keyCode);
      return keyHandler(e)
    }.bind(this))

  }
}


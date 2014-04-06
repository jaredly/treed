
var KEYS = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  9: 'tab',
  13: 'return',
  8: 'backspace'
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
  setupNode: function () {
    this.node = document.createElement('div')
    this.input = document.createElement('input')
    this.node.classList.add('listless__default-node')

    this.node.innerText = this.name
    this.registerListeners();
  },
  startEditing: function (fromStart) {
    if (this.editing) return
    this.editing = true;
    this.node.innerHTML = '';
    this.input.value = this.name;
    this.node.appendChild(this.input);
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
    this.node.removeChild(this.input)
    this.name = this.input.value
    this.node.innerText = this.name
    this.o.changed('name', this.name)
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
      'shift tab': function (e) {
      },
      tab: function (e) {
      }
    }).bind(this)

    this.input.addEventListener('keydown', function (e) {
      console.log(e.keyCode);
      return keyHandler(e)
    }.bind(this))

  }
}



function DefaultNode(data, options) {
  this.name = data.name
  this.o = options
  this.o.keybindings = merge(this.default_keys, options.keys)

  this.editing = false
  this.setupNode();
}

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true
})


DefaultNode.prototype = {
  // Should there be a canStopEditing?
  focus: function () {
    this.startEditing();
  },
  blur: function () {
    this.stopEditing();
  },
  setInputValue: function (value) {
    var html = value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    this.input.innerHTML = html;
  },
  getInputValue: function () {
    return this.input.innerHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  },
  setTextContent: function (value) {
    this.text.innerHTML = marked(value)//.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  },
  addEditText: function (text) {
    var pl = this.name.length
    this.editing = true;
    this.name += text
    this.setInputValue(this.name)
    this.setTextContent(this.name)
    this.node.replaceChild(this.input, this.text)
    // this.input.focus();
    this.o.setEditing();
    this.setSelection(pl)
  },
  setData: function (data) {
    if (undefined !== data.name && data.name !== this.name) {
      this.name = data.name
      this.setInputValue(data.name)
      this.setTextContent(data.name)
    }
    if (undefined !== data.done) {
      this.done = data.done
      if (data.done) {
        this.node.classList.add('listless__default-node--done')
      } else {
        this.node.classList.remove('listless__default-node--done')
      }
    }
  },
  setupNode: function () {
    this.node = document.createElement('div')
    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.classList.add('listless__input')
    this.text = document.createElement('div')
    this.text.classList.add('listless__text')
    this.node.classList.add('listless__default-node')

    this.setTextContent(this.name)
    this.node.appendChild(this.text)
    this.registerListeners();
  },
  isAtTop: function () {
    var bb = this.input.getBoundingClientRect()
      , selr = window.getSelection().getRangeAt(0).getClientRects()[0]
    return selr.top < bb.top + 5
  },
  isAtBottom: function () {
    var bb = this.input.getBoundingClientRect()
      , selr = window.getSelection().getRangeAt(0).getClientRects()[0]
    return selr.bottom > bb.bottom - 5
  },
  insertReturn: function () {
    var sel = window.getSelection()
      , r = sel.getRangeAt(0)
    r.deleteContents()
    r.insertNode(document.createTextNode('\n\u200b'))
    sel.removeAllRanges()
    sel.addRange(r)
    sel.collapseToEnd()
  },
  getSelectionPosition: function () {
    var sel = window.getSelection()
      , ran = sel.getRangeAt(0)
    console.log(ran, ran.startOffset)
    return ran.startOffset
  },
  setSelection: function (end) {
    var sel = window.getSelection()
    sel.selectAllChildren(this.input)
    sel['collapseTo' + (end ? 'End' : 'Start')]()
  },
  startEditing: function (fromStart) {
    if (this.editing) return
    this.editing = true;
    this.setInputValue(this.name)
    this.node.replaceChild(this.input, this.text)
    this.input.focus();
    this.setSelection(!fromStart)
    this.o.setEditing()
  },
  stopEditing: function () {
    if (!this.editing) return
    var value = this.getInputValue()
    if (this.name != value) {
      this.setTextContent(value)
      this.name = value
      this.o.changed('name', this.name)
    }
    this.editing = false
    this.node.replaceChild(this.text, this.input)
    this.o.doneEditing();
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
    'toggle done': 'ctrl return',
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
    'toggle done': function () {
      this.blur()
      this.o.changed('done', !this.done)
      this.focus()
      if (this.done) {
        this.o.goDown()
      }
    },
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
      var ss = this.getSelectionPosition()
      if (ss === 0) {
        return this.o.goUp()
      }
      return true
    },
    'right': function () {
      var ss = this.getSelectionPosition()
        , value = this.getInputValue()
      if (ss === value.length) {
        return this.o.goDown(true)
      }
      return true
    },
    'insert return': function () {
      this.insertReturn()
    },
    'add after': function () {
      var ss = this.getSelectionPosition()
        , name = this.getInputValue()
        , rest = null
      if (name.indexOf('\n') !== -1) {
        this.insertReturn()
        return false
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
    'merge up': function () {
      var value = this.getInputValue()
      if (!value) {
        return this.o.remove()
      }
      var selpos = this.getSelectionPosition()
      if (selpos == this.input.selectionEnd && selpos === 0) {
        return this.o.remove(value)
      }
      return true
    },
    'stop editing': function () {
      this.stopEditing();
    }
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
    
    var actions = {}
    for (var name in this.o.keybindings) {
      actions[this.o.keybindings[name]] = this.actions[name]
    }

    var keyHandler = keys(actions).bind(this)

    this.input.addEventListener('keydown', function (e) {
      e.stopPropagation()
      // console.log(e.keyCode);
      return keyHandler(e)
    })

  }
}



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
    return this.input.innerHTML.replace(/<div>/g, '\n').replace(/<br>/g, '\n').replace(/<\/div>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
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

  backspace: function () {
    var sel = window.getSelection()
      , r = sel.getRangeAt(0)
      , n = r.startContainer
    if (n.nodeType === 3) {
      while (n && !n.nodeValue.length) {
        n = n.previousSibling
      }
      console.log(n, n.nodeValue, n.nodeValue.length, n.nodeValue.indexOf('\u200b'))
      if (!n) return true
      var text = n.nodeValue
        , ix = text.indexOf('\n\u200b')
      console.log(text, ix)
      if (ix !== -1 && ix === r.endOffset - 2) {
        n.nodeValue = text.slice(0, ix) + text.slice(ix + 2)
        r.setStart(n, ix)
        r.setEnd(n, ix)
        sel.removeAllRanges()
        sel.addRange(r)
        return
      }
    } else {
      console.log(n, n.nodeType)
    }
    return false
  },
  insertReturn: function () {
    var sel = window.getSelection()
      , r = sel.getRangeAt(0)
    // r.deleteContents()
    // var d = document.createElement('div')
    // d.appendChild(document.createTextNode(''))
    // r.insertNode(d)
    // r.surroundContents(d)
    // r.insertNode(document.createElement('div'))
    // br.classList.add('break')
    // r.selectAll
    // var r = document.createRange()
    // r.selectNodeContents(d)
    // r.setEndAfter(br)
    // sel.addRange(r)
    // sel.collapseToEnd()

    var p = r.startContainer
      , n
      , i
    if (p.nodeType === 3) {
      // text
      n = p
      i = r.startOffset
    } else {
      n = p.childNodes[r.startOffset]
      while (n.nodeType !== 3 && n.firstChild) {
        n = n.firstChild
      }
      if (n.nodeType !== 3) return
      i = 0
    }
    var t = n.nodeValue
    n.nodeValue = t.slice(0, i) + '\n\u200b' + t.slice(i)
    var rn = document.createRange()
    rn.setStart(n, i+2)
    rn.setEnd(n, i+2)
    sel.removeAllRanges()
    sel.addRange(rn)

    // sel.collapseToEnd()

      /*
    r.insertNode(document.createTextNode('\n\u200b'))
    sel.addRange(r)
    sel.collapseToEnd()
    */

    /** almost
    var tn = document.createElement('span')
    r.insertNode(tn)
    r.insertNode(document.createElement('br'))

    var nr = document.createRange()
    nr.selectNodeContents(tn)
    //nr.setStart(tn, 0)
    //nr.setEnd(tn, 0)
    sel.removeAllRanges()
    sel.addRange(nr)
    **/

    /**
    var br = document.createElement('div')
    br.appendChild(document.createTextNode(''))
    r.insertNode(br)
    sel.removeAllRanges()
    r.selectNodeContents(br)
    var nr = document.createRange()
    nr.setStart(br, 0)
    nr.setEnd(br, 0)
    sel.addRange(nr)
    **/
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
    'insert return': function (e) {
      this.insertReturn()
      e.preventDefault()
      e.stopPropagation()
      return false
    },
    'add after': function () {
      var ss = this.getSelectionPosition()
        , name = this.getInputValue()
        , rest = null
      if (name.indexOf('\n') !== -1) {
        this.insertReturn()
        return
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
      var res = this.backspace()
      if (res !== false) {
        return res
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
      //this.stopEditing();
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


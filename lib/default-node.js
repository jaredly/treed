
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true
})

function DefaultNode(data, options, isNew) {
  BaseNode.call(this, data, options, isNew)
}

DefaultNode.prototype = Object.create(BaseNode.prototype)
DefaultNode.prototype.constructor = DefaultNode
// merge(DefaultNode, BaseNode)

function tmerge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
}

tmerge(DefaultNode.prototype, {
  setInputValue: function (value) {
    var html = value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    this.input.innerHTML = html;
  },
  getInputValue: function () {
    return this.input.innerHTML
            .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
            .replace(/<\/div>/g, '').replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>').replace(/\u200b/g, '')
  },
  setTextContent: function (value) {
    this.text.innerHTML = marked(value)
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
  getSelectionPosition: function () {
    var sel = window.getSelection()
      , ran = sel.getRangeAt(0)
    return ran.startOffset
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
    this.editing = false
    this.node.replaceChild(this.text, this.input)
    this.o.doneEditing();
    if (this.name != value || this.isNew) {
      this.setTextContent(value)
      this.name = value
      this.o.changed('name', this.name)
    }
  },

  isAtStart: function () {
    return this.getSelectionPosition() === 0
  },

  isAtEnd: function () {
    console.warn("THIS IS WRONG")
    return false
  },
  addEditText: function (text) {
    var pl = this.name.length
    this.name += text
    this.setInputValue(this.name)
    this.setTextContent(this.name)
    if (!this.editing) {
      this.editing = true;
      this.node.replaceChild(this.input, this.text)
      this.o.setEditing();
    }
    this.setSelection(pl)
  },
  setAttr: function (attr, value) {
    if (attr === 'name') {
      this.name = value
      this.setInputValue(value)
      this.setTextContent(value)
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
    
    var keyHandler = this.keyHandler()

    this.input.addEventListener('keydown', function (e) {
      e.stopPropagation()
      return keyHandler(e)
    })

  },
  setSelection: function (end) {
    var sel = window.getSelection()
    sel.selectAllChildren(this.input)
    try {
      sel['collapseTo' + (end ? 'End' : 'Start')]()
    } catch (e) {}
  },

})


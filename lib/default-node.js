
module.exports = DefaultNode

var BaseNode = require('./base-node')

if (window.marked) {
  var renderer = new marked.Renderer()
  renderer.link = function (href, title, text) {
    return '<a href="' + href + '" target="_blank" title="' + title + '">' + text + '</a>';
  }
  marked.setOptions({
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    renderer: renderer
  })
}

function DefaultNode(content, meta, options, isNew) {
  BaseNode.call(this, content, meta, options, isNew)
}

DefaultNode.prototype = Object.create(BaseNode.prototype)
DefaultNode.prototype.constructor = DefaultNode

function tmerge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

function unEscapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/\u200b/g, '')
}

tmerge(DefaultNode.prototype, {
  setInputValue: function (value) {
    this.input.innerHTML = value
  },

  getInputValue: function () {
    return unEscapeHtml(this.input.innerHTML)
  },

  getVisibleValue: function () {
    return this.input.firstChild.textContent
  },

  isMultiLine: function () {
    return this.input.innerHTML.match(/(<div>|<br|\n)/g)
  },

  splitRightOfCursor: function () {
    var text = this.input.firstChild.textContent
      , s = this.getSelectionPosition()
      , left = escapeHtml(text.slice(0, s))
      , right = escapeHtml(text.slice(s))
    if (!right) return
    this.setInputValue(left)
    this.setTextContent(left)
    if (!this.isNew) this.o.changeContent(left)
    return right
  },

  setTextContent: function (value) {
    this.text.innerHTML = value ? marked(value) : ''
  },

  setupNode: function () {
    this.node = document.createElement('div')

    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.classList.add('treed__input')

    this.text = document.createElement('div')
    this.text.classList.add('treed__text')
    this.node.classList.add('treed__default-node')

    this.setTextContent(this.content)
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
    this.setInputValue(this.content)
    this.node.replaceChild(this.input, this.text)
    this.input.focus();
    this.setSelection(!fromStart)
    this.o.setEditing()
  },

  stopEditing: function () {
    if (!this.editing) return
    console.log('stop eddint', this.isNew)
    var value = this.getInputValue()
    this.editing = false
    this.node.replaceChild(this.text, this.input)
    this.o.doneEditing();
    if (this.content != value || this.isNew) {
      this.setTextContent(value)
      this.content = value
      this.o.changeContent(this.content)
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
    var pl = this.content.length
    this.content += text
    this.setInputValue(this.content)
    this.setTextContent(this.content)
    if (!this.editing) {
      this.editing = true;
      this.node.replaceChild(this.input, this.text)
      this.o.setEditing();
    }
    this.setSelection(pl)
  },

  setContent: function (content) {
    this.content = content
    this.setInputValue(content)
    this.setTextContent(content)
  },

  registerListeners: function () {
    this.text.addEventListener('mousedown', function (e) {
      if (e.target.nodeName == 'A') {
        return
      }
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


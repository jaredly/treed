
module.exports = Block

function unEscapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/\u200b/g, '')
}

function Block(data, children, config, options) {
  this.o = options
  this.editing = false
  this._moved = false
  this.setupNode(data, children)
  this.reposition(config.left, config.top, true)
  // this.resize(config.width, config.height, true)
}

Block.prototype = {
  setupNode: function (data, children) {
    this.node = document.createElement('div')
    this.node.className = 'whiteboard-item'
    // this.node.addEventListener('mousedown', this._onMouseDown.bind(this))
    this.node.addEventListener('mouseup', this._onMouseUp.bind(this))
    this.node.addEventListener('mousemove', this._onMouseMove.bind(this))

    this.title = document.createElement('div')
    this.title.className='whiteboard-item_title'
    // this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('mousedown', this._onMouseDown.bind(this))
    this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('dblclick', this.o.onZoom)

    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.className = 'whiteboard-item_input'
    this.input.addEventListener('blur', this._onBlur.bind(this))

    this.body = document.createElement('ul')
    this.body.className='whiteboard-item_body'

    children.forEach(function (child) {
      var node = document.createElement('li')
      node.className='whiteboard-item_child'
      node.innerHTML = child.content ? marked(child.content) : '<em>Click here to edit</em>'
      node.addEventListener('mousedown', this._onMouseDownChild.bind(this, child.id))
      this.body.appendChild(node)
    }.bind(this))

    /*
    this.footer = document.createElement('div')
    this.footer.className = 'whiteboard-item_footer'
    var zoom = document.createElement('i')
    zoom.className = 'fa fa-expand zoom'
    zoom.addEventListener('click', this.o.onZoom)
    this.footer.appendChild(zoom)
    */


    this.node.appendChild(this.title)
    this.node.appendChild(this.body)
    // this.node.appendChild(this.footer)

    this.setTextContent(data.content)
    this.content = data.content
    return this.node
  },

  // Children!!
  addChild: function () {
    console.log('faile')
  },



  // Not children!!

  updateConfig: function (config) {
    this.reposition(config.left, config.top, true)
    // this.resize(config.width, config.height, true)
  },

  setContent: function (content) {
    if (content === this.content) return
    this.setTextContent(content)
    this.setInputValue(content)
  },

  _onBlur: function (e) {
    this.stopEditing()
    e.preventDefault()
    return false
  },

  _onMouseMove: function (e) {
    if (e.shiftKey) {
      var rect = this.node.getBoundingClientRect()
      this.o.startMoving(e, rect, true)
    }
  },

  _onMouseUp: function (e) {
  },

  _onClick: function (e) {
    if (this._moved) {
      this._moved = false
      return
    }
    this.startEditing()
    e.preventDefault()
    return false
  },

  _onMouseDownChild: function (id, e) {
  },

  _onMouseDown: function (e) {
    this._moved = false
    if (e.target !== this.input) {
      e.preventDefault()
      document.activeElement.blur()
    }
    var rect = this.node.getBoundingClientRect()
    this.o.startMoving(e, rect)
      //, top = e.clientY - rect.top
      //, left = e.clientX - rect.left
    /**
     * TODO: resizability ?
    if (left > rect.width - 10) {
      return this.startResizing('x')
    }
    if (top > rect.height - 10) {
      return this.startResizing('y')
    }
     */
    //this.o.startMoving(left, top)
    return false
  },

  startEditing: function (fromStart) {
    if (this.editing) return
    this.node.classList.add('whiteboard-item--editing')
    this.editing = true;
    this.setInputValue(this.content)
    this.node.replaceChild(this.input, this.title)
    this.input.focus();
    this.setSelection(!fromStart)
  },

  stopEditing: function () {
    if (!this.editing) return
    this.node.classList.remove('whiteboard-item--editing')
    console.log('stop eddint', this.isNew)
    var value = this.getInputValue()
    this.editing = false
    this.node.replaceChild(this.title, this.input)
    if (this.content != value) {
      this.setTextContent(value)
      this.content = value
      this.o.changeContent(this.content)
    }
  },

  setSelection: function (end) {
    var sel = window.getSelection()
    sel.selectAllChildren(this.input)
    try {
      sel['collapseTo' + (end ? 'End' : 'Start')]()
    } catch (e) {}
  },

  focus: function () {
    this.startEditing()
  },

  setTextContent: function (value) {
    this.title.innerHTML = value ? marked(value) : ''
  },

  setInputValue: function (value) {
    this.input.innerHTML = value
  },

  getInputValue: function () {
    return unEscapeHtml(this.input.innerHTML)
  },

  reposition: function (x, y, silent) {
    if (x !== this.x || y !== this.y) {
      this._moved = true
    }
    this.x = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
    if (!silent) {
      this.saveConfig()
    }
  },

  resize: function (width, height, silent) {
    this.width = width
    this.height = height
    this.node.style.width = width + 'px'
    this.node.style.height = height + 'px'
    if (!silent) {
      this.saveConfig()
    }
  },

  saveConfig: function () {
    this.o.saveConfig({
      left: this.x,
      top: this.y,
      width: this.width,
      height: this.height
    })
  },

  saveContent: function () {
    this.o.saveContent(this.content)
  },

  mouseMove: function (e) {
  },

  mouseUp: function (e) {
  },

  click: function (e) {
    this.startEditing()
  },

  blur: function () {
    this.stopEditing()
  },

  keyDown: function (e) {
  }
}



module.exports = Block

function unEscapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/<div>/g, '\n').replace(/<br>/g, '\n')
    .replace(/<\/div>/g, '')
    .replace(/\u200b/g, '')
}

/**
 * Config looks like:
 * {
 *   top: num,
 *   left: num, (from meta.whiteboard)
 *  }
 * Options looks like:
 * {
 *  saveConfig
 *  saveContent
 *  changeContent
 *  startMoving(event, rect, ?shiftMove)
 *  startMovingChild(event, id, ?shiftMove)
 *  onZoom
 * }
 */
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
    this.node.addEventListener('mousedown', this._onMouseDown.bind(this))

    this.title = document.createElement('div')
    this.title.className='whiteboard-item_title'
    // this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('click', this._onClick.bind(this))
    this.title.addEventListener('dblclick', this.o.onZoom)

    this.input = document.createElement('div')
    this.input.setAttribute('contenteditable', true)
    this.input.className = 'whiteboard-item_input'
    this.input.addEventListener('blur', this._onBlur.bind(this))

    this.body = document.createElement('ul')
    this.body.className='whiteboard-item_body'

    var zoom = document.createElement('div')
    zoom.className = 'whiteboard-item_zoom'
    zoom.innerHTML = '<i class="fa fa-expand"/>'
    zoom.addEventListener('click', this.o.onZoom)

    this.children = {}

    children.forEach(function (child) {
      var node = this.createChild(child)
      // node.addEventListener('mousedown', this._onMouseDownChild.bind(this, child.id))
      this.body.appendChild(node)
      this.children[child.id] = node
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
    this.node.appendChild(zoom)
    // this.node.appendChild(this.footer)

    this.setTextContent(data.content)
    this.content = data.content
    return this.node
  },

  remove: function () {
    this.node.parentNode.removeChild(this.node)
    return true
  },

  /**
   * pid: the id of this block
   * cid: the child that is being moved
   * children: list of child ids
   */
  getChildTargets: function (cid, bid, children) {
    var targets = children ? children.map(this.childTarget.bind(this, bid)) : []
    targets.push(this.wholeTarget(bid, children.length))
    return targets
  },

  childTarget: function (pid, id, i) {
    var box = this.children[id].getBoundingClientRect()
      , magic = 10
    return {
      hit: {
        left: box.left,
        right: box.right,
        top: box.top - magic,
        bottom: box.bottom - magic
      },
      pos: i,
      pid: pid,
      draw: {
        left: box.left,
        width: box.width,
        top: box.top - magic/2,
        height: magic
      }
    }
  },

  /**
   * id: the box id
   * last: the last index in the child list
   */
  wholeTarget: function (id, last) {
    var box = this.node.getBoundingClientRect()
      , magic = 10
    return {
      hit: box,
      pid: id,
      pos: last,
      draw: {
        top: box.bottom - magic,
        left: box.left + magic/2,
        height: magic,
        width: box.width - magic
      }
    }
  },


  // Children!!


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
    if (e.target.classList.contains('handle')) {
      return
    }
    if (!e.shiftKey) return
    var rect = this.node.getBoundingClientRect()
    if (this.o.startMoving(e, rect, true)) {
      this.node.classList.add('whiteboard-item--moving')
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

  _onMouseMoveChild: function (id, e) {
    if (!e.shiftKey) return
    e.preventDefault()
    var clone = this.children[id].lastChild.cloneNode(true)
    if (this.o.startMovingChild(e, id, clone, true)) {
      this.children[id].classList.add('whiteboard-item_child--moving')
    }
  },

  _onMouseDownChild: function (id, e) {
    e.stopPropagation()
    e.preventDefault()
    var clone = this.children[id].lastChild.cloneNode(true)
    if (this.o.startMovingChild(e, id, clone)) {
      this.children[id].classList.add('whiteboard-item_child--moving')
    }
  },

  _onMouseDown: function (e) {
    if (e.button !== 0) {
      return
    }
    this._moved = false
    if (e.target !== this.input) {
      e.preventDefault()
      document.activeElement.blur()
    }
    var rect = this.node.getBoundingClientRect()
    this.node.classList.add('whiteboard-item--moving')
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

  removeChild: function (id) {
    if (!this.children[id]) {
      return false
    }
    this.children[id].parentNode.removeChild(this.children[id])
    delete this.children[id]
  },

  addChild: function (child, id, before) {
    var node = this.createChild(child)
    if (before === false) {
      this.body.appendChild(node)
    } else {
      this.body.insertBefore(node, this.children[before])
    }
    this.children[id] = node
  },

  createChild: function (child) {
    var node = document.createElement('li')
    node.className='whiteboard-item_child'
    if (child.children && child.children.length) {
      node.classList.add('whiteboard-item_child--parent')
    }
    var body = document.createElement('div')
    body.innerHTML = child.content ? marked(child.content) : '<em>Click here to edit</em>'
    var handle = document.createElement('div')
    handle.className = 'handle'
    handle.innerHTML = '<i class="fa fa-circle"/>'
    handle.addEventListener('mousemove', this._onMouseMoveChild.bind(this, child.id))
    handle.addEventListener('mousedown', this._onMouseDownChild.bind(this, child.id))
    node.appendChild(handle)
    node.appendChild(body)
    return node
  },

  doneMoving: function () {
    this.node.classList.remove('whiteboard-item--moving')
  },

  doneMovingChild: function (id) {
    this.children[id].classList.remove('whiteboard-item_child--moving')
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


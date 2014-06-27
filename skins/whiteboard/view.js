
var DungeonsAndDragons = require('../../lib/dnd.js')
var Block = require('./block')

module.exports = View

function View(bindActions, model, ctrl, options) {
  this.mode = 'normal'
  this.active = null
  this.ids = {}

  this.bindActions = bindActions
  this.model = model
  this.ctrl = ctrl

  this._boundMove = this._onMouseMove.bind(this)
  this._boundUp = this._onMouseUp.bind(this)
}

View.prototype = {
  initialize: function (root) {
    var node = this.model.ids[root]
    this.setupRoot()
    this.root = root
    this.makeBlocks(root)
    return this.rootNode
  },

  setupRoot: function () {
    var rootNode = document.createElement('div')
    rootNode.className='whiteboard'
    rootNode.addEventListener('dblclick', this._onDoubleClick.bind(this))
    rootNode.addEventListener('mousedown', this._onMouseDown.bind(this))
    this.container = document.createElement('div')
    this.container.className = 'whiteboard-container'
    rootNode.appendChild(this.container)
    this.rootNode = rootNode
  },

  getActive: function () {
    return this.root
  },

  addTree: function (node, before) {
    if (node.parent !== this.root) return;
    this.makeBlock(node.id, 0)
  },

  setCollapsed: function () {
  },
  startEditing: function () {
  },
  setActive: function () {
  },
  setSelection: function () {
  },
  remove: function (id) {
    console.warn("FIX??")
    this.container.removeChild(this.ids[id].node)
    delete this.ids[id]
  },
  goTo: function () {
    console.warn('FIX!');
  },
  clear: function () {
    for (var id in this.ids) {
      this.container.removeChild(this.ids[id].node)
    }
    this.ids = {}
  },

  rebase: function (newroot, trigger) {
    this.clear()
    this.makeBlocks(newroot)
  },

  makeBlocks: function (root) {
    var children = this.model.ids[root].children
    if (!children) return
    children.forEach(this.makeBlock.bind(this));
  },

  makeBlock: function (id, i) {
    var node = this.model.ids[id]
      , config = node.meta.whiteboard
    if (!config) {
      config = {
        width: 200,
        height: 200,
        top: 10,
        left: i * 210
      }
    }
    var block = new Block(node, config, {
      saveConfig: function (config) {
        this.ctrl.executeCommands('changeNodeAttr', [node.id, 'whiteboard', config]);
      }.bind(this),
      saveContent: function (content) {
        this.ctrl.executeCommands('changeContent', [node.id, content]);
      }.bind(this),
      changeContent: function (content) {
        this.ctrl.executeCommands('changeContent', [node.id, content]);
      }.bind(this),
      startMoving: function (x, y) {
        this._onStartMoving(node.id, x, y)
      }.bind(this),
    })
    this.ids[id] = block
    this.container.appendChild(block.node)
    return block
  },

  setAttr: function (id, attr, value) {
    if (!this.ids[id]) {
      return
    }
    if (attr === 'whiteboard') {
      this.ids[id].updateConfig(value)
    }
    // TODO something with done-ness?
  },

  setContent: function (id, content) {
    if (!this.ids[id]) {
      return
    }
    this.ids[id].setContent(content)
  },

  shuffleZIndices: function (top) {
    var items = [];
    for (var id in this.ids) {
      items.push([+this.ids[id].node.style.zIndex, id])
    }
    items.sort(function (a, b) {
      return a[0] - b[0]
    })
    for (var i=0; i<items.length; i++) {
      this.ids[items[i][1]].node.style.zIndex = i
    }
    this.ids[top].node.style.zIndex = items.length
  },

  // event handlers

  _onDoubleClick: function (e) {
    if (e.target !== this.rootNode) {
      return
    }
    var box = this.container.getBoundingClientRect()
    var x = e.clientX - 50 - box.left
      , y = e.clientY - 10 - box.top
      , idx = this.model.ids[this.root].children.length
    this.ctrl.executeCommands('newNode', [this.root, idx, '', {
      whiteboard: {
        width: 200,
        height: 200,
        top: y,
        left: x
      }
    }]);
  },

  _onMouseDown: function (e) {
    if (e.target !== this.rootNode) {
      return
    }
    var box = this.container.getBoundingClientRect()
    var x = e.clientX - box.left
      , y = e.clientY - box.top
    this.moving = {
      x: x,
      y: y
    }
    e.preventDefault()
    document.addEventListener('mousemove', this._boundMove)
    document.addEventListener('mouseup', this._boundUp)
  },

  // other stuff

  add: function (node, before, dontfocus) {
    var block = this.makeBlock(node.id, 0)
    block.node.style.zIndex = Object.keys(this.ids).length
    if (!dontfocus) {
      block.focus()
    }
  },

  _onStartMoving: function (id, x, y) {
    this.moving = {
      id: id,
      x: x,
      y: y
    }
    console.log(this.moving)
    document.addEventListener('mousemove', this._boundMove)
    document.addEventListener('mouseup', this._boundUp)
    this.shuffleZIndices(id)
  },

  _onMouseMove: function (e) {
    if (!this.moving) {
      return this._onMouseUp(e)
    }
    e.preventDefault()
    if (this.moving.id) {
      var box = this.container.getBoundingClientRect()
      var x = e.clientX - this.moving.x - box.left
        , y = e.clientY - this.moving.y - box.top
      this.ids[this.moving.id].reposition(x, y, true)
    } else {
      var box = this.rootNode.getBoundingClientRect()
      var x = e.clientX - this.moving.x - box.left
        , y = e.clientY - this.moving.y - box.top
      this.container.style.top = y + 'px'
      this.container.style.left = x + 'px'
    }
    return false
  },

  _onMouseUp: function (e) {
    if (this.moving && this.moving.id) {
      var box = this.container.getBoundingClientRect()
      var x = e.clientX - this.moving.x - box.left
        , y = e.clientY - this.moving.y - box.top
      this.ids[this.moving.id].reposition(x, y)
    }
    this.moving = null
    e.preventDefault()
    document.removeEventListener('mousemove', this._boundMove)
    document.removeEventListener('mouseup', this._boundUp)
    return false
  },

  getNode: function () {
    return this.rootNode
  }
}


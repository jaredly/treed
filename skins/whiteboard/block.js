
module.exports = Block

function Block(config) {
  this.node = document.createElement('div')
  this.reposition(config.x, config.y, true)
  this.resize(config.width, config.height, true)
}

Block.prototype = {
  reposition: function (x, y, silent) {
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
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    })
  },

  saveContent: function () {
    this.o.saveContent(this.content)
  },

  startEditing: function () {
  },

  mouseDown: function (e) {

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


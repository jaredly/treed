
module.exports = Root

function Root() {
  this.node = document.createElement('div')
  this.container = document.createElement('div')
  this.node.appendChild(this.container)
  this.x = 0
  this.y = 0
  this.moving = null
  this.node.addEventListener('mousedown', this.mouseDown.bind(this));
  this.node.addEventListener('mousemove', this.mouseMove.bind(this));
  this.node.addEventListener('mouseup', this.mouseUp.bind(this));
  // this.zoom ?
}

Root.prototype = {
  mouseDown: function (e) {
    this.moving = {
      x: e.clientX - this.x,
      y: e.clientY - this.y
    }
    e.preventDefault()
  },
  mouseMove: function (e) {
    if (!this.moving) return
    if (!e.which) {
      this.moving = null
      return
    }
    e.preventDefault()
    var x = e.clientX - this.moving.x
    var y = e.clientY - this.moving.y
    this.reposition(x, y)
  },
  mouseUp: function (e) {
    this.moving = null
  },
  reposition: function (x, y) {
    this.x = x
    this.y = y
    this.container.style.top = y + 'px'
    this.container.style.left = x + 'px'
  }
}


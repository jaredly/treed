
var DefaultNode = require('./lib/default-node')

module.exports = WFNode

function WFNode(data, options, isNew) {
  DefaultNode.call(this, data, options, isNew)
}

WFNode.prototype = Object.create(DefaultNode.prototype)
WFNode.prototype.constructor = WFNode

WFNode.prototype.setAttr = function (attr, value) {
  if (attr !== 'done') {
    DefaultNode.prototype.setAttr.call(this, attr, value)
    return
  }
  this.done = value
  if (value) {
    this.node.classList.add('listless__default-node--done')
  } else {
    this.node.classList.remove('listless__default-node--done')
  }
}

WFNode.prototype.extra_actions = {
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.o.clickBullet()
    }
  },
  'back a level': {
    binding: 'shift+alt+return',
    action: function () {
      this.o.backALevel()
    }
  },
  'toggle done': {
    binding: 'ctrl+return',
    action: function () {
      this.blur()
      this.o.changed('done', !this.done)
      this.focus()
      if (this.done) {
        this.o.goDown()
      }
    }
  }
}


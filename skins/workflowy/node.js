
var DefaultNode = require('../../lib/default-node')
var Tags = require('./tags')

module.exports = WFNode

function WFNode(content, meta, actions, isNew, modelActions) {
  DefaultNode.call(this, content, meta, actions, isNew, modelActions)
  this.done = meta.done
  this.tags = new Tags(modelActions.resolveTags(meta.tags), actions, modelActions)
  this.node.appendChild(this.tags.node)
  if (meta.done) {
    this.node.classList.add('treed__default-node--done')
  }
}

WFNode.prototype = Object.create(DefaultNode.prototype)
WFNode.prototype.constructor = WFNode

WFNode.prototype.setAttr = function (attr, value) {
  if (attr === 'tags') {
    return this.setTags(value)
  }
  if (attr === 'done') {
    return this.setDone(value)
  }
  DefaultNode.prototype.setAttr.call(this, attr, value)
}

WFNode.prototype.addTag = function (node) {
  this.tags.add(node)
}

WFNode.prototype.removeTag = function (tid) {
  this.tags.remove(tid)
}

WFNode.prototype.setTags = function (tags) {
  this.tags.set(this.modelActions.resolveTags(tags))
}

WFNode.prototype.setDone = function (isDone) {
  this.done = isDone
  if (isDone) {
    this.node.classList.add('treed__default-node--done')
  } else {
    this.node.classList.remove('treed__default-node--done')
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


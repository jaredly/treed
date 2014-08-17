
var DomViewLayer = require('../../lib/dom-vl')

module.exports = WFVL

function WFVL() {
  DomViewLayer.apply(this, arguments)
}

WFVL.prototype = Object.create(DomViewLayer.prototype)

WFVL.prototype.removeTag = function (id, tid) {
  var body = this.body(id)
  if (!body) return
  body.removeTag(tid)
}

WFVL.prototype.addTag = function (id, node) {
  var body = this.body(id)
  if (!body) return
  body.addTag(node)
}

WFVL.prototype.addReference = function (id, rid) {
  // TODO fill in 
}

WFVL.prototype.removeReference = function (id, rid) {
  // TODO fill this in
}

WFVL.prototype.editTags = function (id) {
  this.body(id).tags.startEditing()
}

WFVL.prototype.makeHead = function (body, actions) {
  var head = DomViewLayer.prototype.makeHead.call(this, body, actions)
    , bullet = document.createElement('div')
  bullet.classList.add('treed__bullet')
  bullet.addEventListener('mousedown', actions.clickBullet)
  head.insertBefore(bullet, head.childNodes[1])
  return head
}


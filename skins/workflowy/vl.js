
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

WFVL.prototype.makeRoot = function (node, bounds, modelActions) {
  var root = DomViewLayer.prototype.makeRoot.call(this, node, bounds, modelActions)
  this.references = document.createElement('div')
  this.references.className = 'treed_references'
  this.rfs = {}
  root.appendChild(this.references)
  return root
}


WFVL.prototype.addReference = function (node, action) {
  var div = document.createElement('div')
  div.className = 'treed_references'
  div.innerHTML = marked(node.content)
  div.addEventListener('click', action)
  this.rfs[node.id] = div
  this.references.appendChild(div)
}

WFVL.prototype.removeReference = function (id, rid) {
  // TODO fill this in
}


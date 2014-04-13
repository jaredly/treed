
function WFController(root, ids, options) {
  options = merge({
    Model: WFModel,
    viewOptions: {
      ViewLayer: WFVL,
      noSelectRoot: true
    },
    onBullet: function () {}
  }, options)
  Controller.call(this, root, ids, options)
  this.o.onBullet(this.model.getLineage(root))
}

WFController.prototype = Object.create(Controller.prototype)

WFController.prototype.actions = extend({
  clickBullet: function (id) {
    this.view.rebase(id)
    this.o.onBullet(this.model.getLineage(id))
  }
}, Controller.prototype.actions)

function WFVL() {
  DomViewLayer.apply(this, arguments)
}

WFVL.prototype = Object.create(DomViewLayer.prototype)

WFVL.prototype.makeHead = function (body, actions) {
  var head = DomViewLayer.prototype.makeHead.call(this, body, actions)
    , bullet = document.createElement('div')
  bullet.classList.add('listless__bullet')
  bullet.addEventListener('mousedown', actions.clickBullet)
  head.insertBefore(bullet, head.childNodes[1])
  return head
}

function WFModel() {
  Model.apply(this, arguments)
}

WFModel.prototype = Object.create(Model.prototype)

WFModel.prototype.getLineage = function (id) {
  var lineage = []
  while (this.ids[id]) {
    lineage.unshift({
      name: this.ids[id].data.name,
      id: id
    })
    id = this.ids[id].parent
  }
  return lineage
}


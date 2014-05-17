
var Model = require('./lib/model')

module.exports = WFModel

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



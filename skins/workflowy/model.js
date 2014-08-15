
var Model = require('../../lib/model')

module.exports = WFModel

function WFModel() {
  Model.apply(this, arguments)
}

WFModel.prototype = Object.create(Model.prototype)

WFModel.prototype.actions = {
  resolveTags: function (tags) {
    if (!tags) return []
    return tags.map(function (id) {
      return this.ids[id]
    }.bind(this))
  },
  getAllTags: function () {
  }
}

WFModel.prototype.getLineage = function (id) {
  var lineage = []
  while (this.ids[id]) {
    lineage.unshift({
      content: this.ids[id].content,
      id: id
    })
    id = this.ids[id].parent
  }
  return lineage
}

WFModel.prototype.search = function (text) {
  var items = []
    , frontier = [this.root]
  text = text.toLowerCase()
  while (frontier.length) {
      var next = []
      for (var i=0; i<frontier.length; i++) {
          var content = this.ids[frontier[i]].content
          if (content && content.toLowerCase().indexOf(text) !== -1) {
            items.push({id: frontier[i], text: this.ids[frontier[i]].content})
          }
          var children = this.ids[frontier[i]].children
          if (children) {
            next = next.concat(children)
          }
      }
      frontier = next
  }
  return items
}


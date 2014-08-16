
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
    var tags = []
    for (var id in this.ids) {
      tags.push(this.ids[id])
    }
    // todo sort by number of references
    return tags
  }
}

// TODO should I make references be a dict instead?
WFModel.prototype.setTags = function (id, tags) {
  var old = this.ids[id].meta.tags
  var used = {}
  if (old) old = old.slice()

  // add references
  if (tags) {
    for (var i=0; i<tags.length; i++) {
      used[tags[i]] = true
      var refs = this.ids[tags[i]].meta.references
      if (!refs) {
        refs = this.ids[tags[i]].meta.references = []
      }
      if (refs.indexOf(id) === -1) {
        refs.push(id)
      }
    }
  }

  // remove old references that were removed
  if (old) {
    for (var i=0; i<old.length; i++) {
      if (used[old[i]]) continue;
      var refs = this.ids[old[i]].meta.references
      refs.splice(refs.indexOf(id), 1)
      used[old[i]] = true
    }
  }

  this.ids[id].meta.tags = tags
  // update things
  this.db.update(id, {meta: this.ids[id].meta})
  for (var oid in used) {
    this.db.update(oid, {meta: this.ids[oid].meta})
  }
  return old
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


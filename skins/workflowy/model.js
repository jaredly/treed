
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

WFModel.prototype.hasTagRoot = function () {
  return !!this.rootNode.tagRoot
}

WFModel.prototype.addTagRoot = function () {
  var index = this.ids[this.root].children ? this.ids[this.root].children.length : 0
  var cr = model.create(this.root, index, 'Tags')
  this.rootNode.tagRoot = cr.node.id
  this.db.update('root', this.root, {tagRoot: cr.node.id})
  return cr
}

WFModel.prototype.addTag = function (name) {
  var tagRoot = this.rootNode.tagRoot
  var index = this.ids[tagRoot].children ? this.ids[tagRoot].children.length : 0
  var cr = model.create(tagRoot, index, name)
  return cr
}

WFModel.prototype.readd = function (saved) {
  this.ids[saved.id] = saved.node
  var children = this.ids[saved.node.parent].children
  children.splice(saved.ix, 0, saved.id)
  var before = false
  if (saved.ix < children.length - 1) {
    before = children[saved.ix + 1]
  }

  var upRefs = {}
  var upTags = {}
  var ids = this.ids

  function process(node) {
    for (var i=0; i<node.children.length; i++) {
      process(ids[node.children[i]])
    }

    if (node.meta.tags) {
      node.meta.tags.forEach(function (id) {
        var refs = ids[id].meta.references
        if (!refs) {
          refs = ids[id].meta.references = []
        }
        if (refs.indexOf(node.id) !== -1) return console.warn('duplicate ref on readd')
        refs.push(node.id)
        upRefs[id] = true
      })
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (id) {
        ids[id].meta.tags.push(node.id)
        var tags = ids[id].meta.tags
        if (!tags) {
          tags = ids[id].meta.tags = []
        }
        if (tags.indexOf(node.id) !== -1) return console.warn('duplicate tag on readd')
        tags.push(node.id)
        upTags[id] = true
      })
    }
  }

  process(this.ids[saved.id])

  this.db.save('node', saved.node.id, saved.node)
  this.db.update('node', saved.node.parent, {children: children})

  for (id in upTags) {
    this.db.update('node', id, {tags: this.ids[id].tags})
  }

  for (id in upRefs) {
    this.db.update('node', id, {references: this.ids[id].references})
  }

  return before
}

WFModel.prototype.dumpData = function (id, noids) {
  var data = Model.prototype.dumpData.call(this, id, noids)
  if (!noids) return data
  delete data.meta.references
  delete data.meta.tags
  return data
}

WFModel.prototype.remove = function (id) {
  // remove the references and tags

  if (id === this.root) return
  var n = this.ids[id]
    , p = this.ids[n.parent]
    , ix = p.children.indexOf(id)

  var upRefs = {}
  var upTags = {}
  var ids = this.ids

  function process(node) {

    if (node.meta.tags) {
      node.meta.tags.forEach(function (id) {
        var refs = ids[id].meta.references
        upRefs[id] = true
        refs.splice(refs.indexOf(node.id), 1)
      })
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (id) {
        var tags = ids[id].meta.tags
        upTags[id] = true
        tags.splice(tags.indexOf(node.id), 1)
      })
    }
    for (var i=0; i<node.children.length; i++) {
      process(ids[node.children[i]])
    }
  }

  process(n)

  p.children.splice(ix, 1)
  delete this.ids[id]


  setTimeout(function () {
    var id
    this.db.remove('node', id)
    this.db.update('node', n.parent, {children: p.children})

    for (id in upTags) {
      if (this.ids[id]) {
        this.db.update('node', id, {tags: this.ids[id].meta.tags})
      }
    }

    for (id in upRefs) {
      if (this.ids[id]) {
        this.db.update('node', id, {references: this.ids[id].meta.references})
      }
    }
  }.bind(this))

  return {id: id, node: n, ix: ix}
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


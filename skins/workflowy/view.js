
var View = require('../../lib/view')

module.exports = WFView

function WFView() {
  View.apply(this, arguments)
}

WFView.prototype = Object.create(View.prototype)

WFView.prototype.initialize = function (root) {
  var rootNode = View.prototype.initialize.call(this, root)
    , node = this.model.ids[root]
  if (node.meta.references) {
    this.vl.setReferences(node.meta.references.map(function (id) {
      return this.model.ids[id]
    }.bind(this)), this.rebase.bind(this))
  }
  return rootNode
}

WFView.prototype.addTree = function (node, before) {
  if (!this.vl.body(node.parent)) {
    return this.rebase(node.parent, true)
  }
  this.add(node, before)

  if (node.meta.tags) {
    node.meta.tags.forEach(function (id) {
      if (id === this.root) {
        this.vl.addReference(this.model.ids[node.id], this.rebase.bind(this, node.id))
      }
    }.bind(this))
  }

  if (node.meta.references) {
    node.meta.references.forEach(function (id) {
      this.vl.addTag(id, node)
    }.bind(this))
  }

  if (!node.children || !node.children.length) return
  for (var i=0; i<node.children.length; i++) {
    this.addTree(this.model.ids[node.children[i]], false)
  }
}

WFView.prototype.remove = function (id, ignoreActive) {
  var node = this.model.ids[id]
    , pid = node.parent
    , parent = this.model.ids[pid]

  if (!this.vl.body(id)) {
    return this.rebase(pid, true)
  }
  if (id === this.active && !ignoreActive) {
    this.setActive(this.root)
  }

  this.vl.remove(id, pid, parent && parent.children.length === 1)
  if (parent.children.length === 1) {
    if (pid === this.root) {
      setTimeout(function () {
      this.addNew(pid, 0)
      }.bind(this),0)
    }
  }

  // remove the references and tags

  var ids = this.model.ids

  function process(node) {
    for (var i=0; i<node.children.length; i++) {
      process.call(this, ids[node.children[i]])
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (rid) {
        this.vl.removeTag(rid, node.id)
      }.bind(this))
    }

    if (node.meta.tags) {
      node.meta.tags.forEach(function (tid) {
        this.vl.removeReference(tid, node.id)
      }.bind(this))
    }
  }

  process.call(this, node)
}

WFView.prototype.setAttr = function (id, attr, value, quiet) {
  var res = View.prototype.setAttr.apply(this, arguments)
  if (attr !== 'references') return res
  if (id !== this.root) return
  this.vl.setReferences(value && value.map(function (id) {
    return this.model.ids[id]
  }.bind(this)), this.rebase.bind(this))
  return res
}

WFView.prototype.setTags = function (id, tags, oldTags) {
  var used = {}
  for (var i=0; i<tags.length; i++) {
    used[tags[i]] = true
  }
  this.setAttr(id, 'tags', tags)
  for (var i=0; i<tags.length; i++) {
    this.setAttr(tags[i], 'references', this.model.ids[tags[i]].meta.references, true)
  }
  for (var i=0; i<oldTags.length; i++) {
    if (used[oldTags[i]]) continue;
    this.setAttr(oldTags[i], 'references', this.model.ids[oldTags[i]].meta.references, true)
  }
}

WFView.prototype.extra_actions = {
  'edit tags': {
    binding: 'shift+3',
    action: function () {
      this.vl.editTags(this.active)
    },
  },
  'rebase': {
    binding: 'alt+return',
    action: function () {
      this.ctrlactions.clickBullet(this.active)
    }
  },
  'back a level': {
    binding: 'shift+alt+return',
    action: function () {
      this.ctrlactions.backALevel()
    }
  },
  'toggle done': {
    binding: 'ctrl+return',
    action: function () {
      if (this.active === null) return
      var id = this.active
        , done = !this.model.ids[id].meta.done
        , next = this.model.idBelow(id, this.root)
      if (next === undefined) next = id
      this.ctrlactions.changed(this.active, 'done', done)
      if (done) {
        this.goTo(next)
      }
    }
  }
}


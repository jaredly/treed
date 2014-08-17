
var View = require('../../lib/view')

module.exports = WFView

function WFView() {
  View.apply(this, arguments)
}

WFView.prototype = Object.create(View.prototype)

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

  var ids = this.ids

  function process(node) {
    for (var i=0; i<node.children.length; i++) {
      process.call(this, ids[node.children[i]])
    }

    if (node.meta.references) {
      node.meta.references.forEach(function (rid) {
        this.vl.removeTag(rid, id)
      }.bind(this))
    }

    if (node.meta.tags) {
      node.meta.tags.forEach(function (tid) {
        this.vl.removeReference(tid, id)
      }.bind(this))
    }
  }

  process.call(this, node)
}

WFView.prototype.setTags = function (id, tags) {
  this.setAttr(id, 'tags', tags)
  // todo update references
  for (var i=0; i<tags.length; i++) {
    this.setAttr(tags[i], 'references', this.model.ids[tags[i]].meta.references, true)
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


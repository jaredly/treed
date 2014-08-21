
module.exports = {
  addTag: {
    args: ['name'],
    apply: function (view, model) {
      if (!model.hasTagRoot()) {
        var cr = model.addTagRoot()
        this.tagRoot = view.add(cr.node, cr.before, true)
      }
      var nr = model.addTag(this.name)
      view.add(nr.node, nr.before, true)
      this.node = nr.node
      return this.node
    },
    undo: function (view, model) {
      model.remove(this.node.id)
      if (this.tagRoot) {
        model.removeTagRoot()
        view.remove(this.tagRoot.node.id)
      }
    }
  },
  setTags: {
    args: ['id', 'tags'],
    apply: function (view, model) {
      this.oldTags = model.setTags(this.id, this.tags)
      view.setTags(this.id, this.tags, this.oldTags)
    },
    undo: function (view, model) {
      model.setTags(this.id, this.oldTags)
      view.setTags(this.id, this.oldTags, this.tags)
    },
  },
}


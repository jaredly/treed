
module.exports = {
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


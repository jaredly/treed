
const eqArr = (a, b) => {
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return !a.some((v, i) => v !== b[i])
}

module.exports = {
  actions: {
    taggingMode: function (id) {
      if (!arguments.length) id = this.view.active
      this.setActive(id)
      console.log('pre mode', this.view.mode)
      this.view.mode = 'tagging'
      this.changed(this.events.modeChanged())
      this.changed(this.events.nodeViewChanged(id))
      console.log('tagging mode', this.view.mode)
    },

    setTags(id, tags) {
      if (eqArr(this.db.nodes[id].tags, tags)) {
        return
      }
      this.set(id, 'tags', tags)
    },
  },

  extend: {
    isTagging: function (id) {
      return 'tagging' === this.view.mode && id === this.view.active
    },
  }
}



module.exports = {
  actions: {
    taggingMode: function (id) {
      if (!arguments.length) id = this.active
      this.actions.setActive(id)
      this.mode = 'tagging'
      this.changed('mode')
    },
  },

  extend: {
    isTagging: function (id) {
      return 'tagging' === this.mode && id === this.active
    },
  }
}


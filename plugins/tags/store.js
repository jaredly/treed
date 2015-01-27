
module.exports = {
  actions: {
    taggingMode: function (id) {
      if (!arguments.length) id = this.view.active
      this.setActive(id)
      this.view.mode = 'tagging'
      this.changed('mode')
    },
  },

  extend: {
    isTagging: function (id) {
      return 'tagging' === this.view.mode && id === this.view.active
    },
  }
}


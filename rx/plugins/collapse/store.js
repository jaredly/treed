
module.exports = {
  actions: {
    collapse: function (id) {
      if (!this.pl.nodes[id].children.length) {
        return
      }
      this.actions.set(id, 'collapsed', true)
    },

    expand: function (id) {
      if (!this.pl.nodes[id].children.length) {
        return
      }
      this.actions.set(id, 'collapsed', false)
    },

    toggleCollapse: function (id) {
      if (!this.pl.nodes[id].children.length) {
        return
      }
      this.actions.set(id, 'collapsed', !this.pl.nodes[id].collapsed)
    },
  },
}


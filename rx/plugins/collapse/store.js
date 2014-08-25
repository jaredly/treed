
module.exports = {
  actions: {
    collapse: function (id) {
      if (!arguments.length) id = this.active
      if (id === this.root) return
      if (!this.pl.nodes[id].children.length) {
        var pid = this.pl.nodes[id].parent
        if (pid !== this.root) {
          this.actions.set(pid, 'collapsed', true)
        }
        return
      }
      this.actions.set(id, 'collapsed', true)
    },

    expand: function (id) {
      if (!arguments.length) id = this.active
      if (id === this.root) return
      if (!this.pl.nodes[id].children.length) {
        return
      }
      this.actions.set(id, 'collapsed', false)
    },

    toggleCollapse: function (id) {
      if (!arguments.length) id = this.active
      if (id === this.root) return
      if (!this.pl.nodes[id].children.length) {
        var pid = this.pl.nodes[id].parent
        if (pid === this.root) return
        this.actions.setActive(pid)
        this.actions.set(pid, 'collapsed', true)
        return
      }
      this.actions.set(id, 'collapsed', !this.pl.nodes[id].collapsed)
    },
  },
}


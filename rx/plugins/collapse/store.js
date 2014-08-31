
module.exports = {
  actions: {
    collapse: function (id) {
      if (!arguments.length) id = this.view.active
      if (id === this.view.root) return
      if (!this.db.nodes[id].children.length) {
        var pid = this.db.nodes[id].parent
        if (pid !== this.view.root) {
          this.set(pid, 'collapsed', true)
          this.setActive(id)
        }
        return
      }
      this.set(id, 'collapsed', true)
      this.setActive(id)
    },

    expand: function (id) {
      if (!arguments.length) id = this.view.active
      if (id === this.view.root) return
      if (!this.db.nodes[id].children.length) {
        return
      }
      this.set(id, 'collapsed', false)
      this.setActive(id)
    },

    toggleCollapse: function (id) {
      if (!arguments.length) id = this.view.active
      if (id === this.view.root) return
      if (!this.db.nodes[id].children.length) {
        var pid = this.db.nodes[id].parent
        if (pid === this.view.root) return
        this.setActive(pid)
        this.set(pid, 'collapsed', true)
        return
      }
      this.set(id, 'collapsed', !this.db.nodes[id].collapsed)
      this.setActive(id)
    },
  },
}


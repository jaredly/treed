
module.exports = {
  actions: {
    rebase: function (id) {
      id = id || this.view.active
      this.view.root = id
      this.setActive(this.view.root)
      this.changed(this.events.rootChanged())
    },
    rebaseUp: function () {
      if (this.view.root === this.db.root) return
      this.setActive(this.view.root)
      this.view.root = this.db.nodes[this.view.root].parent
      this.changed(this.events.rootChanged())
    },
  },

  getters: {
    getPedigree: function (last) {
      var items = []
      var node = this.db.nodes[this.view.root]
      if (!last) {
        node = this.db.nodes[node.parent]
      }
      while (node) {
        items.unshift({
          id: node.id,
          content: node.content
        })
        node = this.db.nodes[node.parent]
      }
      return items
    },
  },
}


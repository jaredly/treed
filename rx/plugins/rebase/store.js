
module.exports = {
  actions: {
    rebase: function (id) {
      id = id || this.view.active
      this.view.root = id
      this.setActive(this.view.root)
      this.changed(this.events.rootChanged())
    },
    rebaseUp: function () {
      if (this.view.root === this.parent.pl.root) return
      this.setActive(this.view.root)
      this.view.root = this.db.nodes[this.view.root].parent
      this.changed(this.events.rootChanged())
    },
  },

  extend: {
    getPedigree: function (id, last) {
      var items = []
      var node = this.db.nodes[id]
      if (!last) {
        node = this.db.nodes[node.parent]
      }
      while (node) {
        items.push({
          id: node.id,
          content: node.content
        })
        node = this.db.nodes[node.parent]
      }
    },
  },
}


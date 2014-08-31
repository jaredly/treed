
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
      this.view.root = this.nodes[this.view.root].parent
      this.changed(this.events.rootChanged())
    },
  },

  extend: {
    getPedigree: function (id, last) {
      var items = []
      var node = this.nodes[id]
      if (!last) {
        node = this.nodes[node.parent]
      }
      while (node) {
        items.push({
          id: node.id,
          content: node.content
        })
        node = this.nodes[node.parent]
      }
    },
  },
}


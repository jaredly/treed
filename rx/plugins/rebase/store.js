
module.exports = {
  actions: {
    rebase: function () {
      this.root = this.active
      this.changed('root')
    },
    rebaseUp: function () {
      if (this.root === this.pl.root) return
      this.root = this.pl.nodes[this.root].parent
      this.active = this.root
      this.changed('root', 'active')
    },
  },

  extend: {
    getPedigree: function (id, last) {
      var items = []
      var node = this.ids[id]
      if (!last) {
        node = this.ids[node.parent]
      }
      while (node) {
        items.push({
          id: node.id,
          content: node.content
        })
        node = this.ids[node.parent]
      }
    },
  },
}


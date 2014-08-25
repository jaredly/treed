
module.exports = {
  actions: {
    rebase: function (id) {
      if (!arguments.length) {
        id = this.active
      }

      this.root = id
      this.active = id
      this.changed('root')
    },
    rebaseUp: function () {
      if (this.root === this.pl.root) return
      this.active = this.root
      this.root = this.pl.nodes[this.root].parent
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


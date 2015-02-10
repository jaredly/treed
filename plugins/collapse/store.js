
module.exports = {
  actions: {
    collapse: function (id) {
      if (!arguments.length) id = this.view.active
      if (id === this.view.root) return
      if (this.view.mode === 'visual') {
        var ids = this.view.selection.filter((id) => 
          !!this.db.nodes[id].children.length)
        if (!ids.length) return
        return this.setMany('collapsed', ids, true)
      }
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
      if (this.view.mode === 'visual') {
        var ids = this.view.selection.filter((id) => 
          !!this.db.nodes[id].children.length)
        if (!ids.length) return
        return this.setMany('collapsed', ids, true)
      }
      if (!this.db.nodes[id].children.length) {
        return
      }
      this.set(id, 'collapsed', false)
      this.setActive(id)
    },

    expandToAndSelect: function (id) {
      var node = this.db.nodes[id]
        , root = this.view.root
        , parent = node.parent
        , current = parent
        , toOpen = []
      if (id !== root) {
        while (current !== root) {
          var node = this.db.nodes[current]
          if (node.collapsed) toOpen.push(current)
          current = node.parent
        }
      }
      if (toOpen.length) this.setMany('collapsed', toOpen, false)
      this.setActive(id)
    },

    toggleCollapseDeep: function (id) {
      if (!arguments.length) id = this.view.active
      if (this.view.mode === 'visual') {
        ids = this.view.selection
      } else {
        var node = this.db.nodes[id]
        if (!node.children.length) return
        ids = [id]
      }
      var allParents = (id) => {
        var node = this.db.nodes[id]
        if (!node.children.length) return []
        return [].concat.apply([id], node.children.map(allParents))
      }
      pedigrees = ids.map(allParents)
      var commands = pedigrees.map((ids) => {
        return ['setMany', {ids: ids, attr: 'collapsed', values: !this.db.nodes[ids[0]].collapsed}]
      })
      this.executeCommands.apply(this, [].concat.apply([], commands))
    },

    toggleCollapse: function (id) {
      if (!arguments.length) id = this.view.active
      if (id === this.view.root) return
      if (this.view.mode === 'visual') {
        var ids = this.view.selection.filter((id) =>
          !!this.db.nodes[id].children.length)
        if (!ids.length) return
        return this.setMany('collapsed', ids, ids.map(id => {
          return !this.db.nodes[id].collapsed
        }))
      }
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


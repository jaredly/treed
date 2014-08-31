
module.exports = {
  actions: {
    setDone: function (id) {
      if (!arguments.length) id = this.view.active
      this.set(id, 'done', true)
    },
    setUndone: function (id) {
      if (!arguments.length) id = this.view.active
      this.set(id, 'done', false)
    },
    toggleDone: function () {
      if (this.view.mode === 'visual') {
        this.batchSet('done', this.view.selected,
                              this.view.selected.map((id) => !this.nodes[id].done))
      } else {
        var done = this.nodes[this.view.active].done
        this.set(this.view.active, 'done', !done)
        this.goDown()
      }
    },
  },
}


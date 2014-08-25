
module.exports = {
  actions: {
    setDone: function (id) {
      if (!arguments.length) id = this.active
      this.actions.set(id, 'done', true)
    },
    setUndone: function (id) {
      if (!arguments.length) id = this.active
      this.actions.set(id, 'done', false)
    },
    toggleDone: function () {
      if (this.mode === 'visual') {
        this.actions.batchSet('done', this.selected,
                              this.selected.map((id) => !this.pl.nodes[id].done))
      } else {
        var done = this.pl.nodes[this.active].done
        this.actions.set(this.active, 'done', !done)
        if (!done) {
          this.actions.goDown()
        }
      }
    },
  },
}


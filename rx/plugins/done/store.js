
module.exports = {
  actions: {
    setDone: function (id, isDone) {
      this.actions.set(id, 'done', isDone)
    },
    toggleActiveDone: function () {
      this.actions.set(this.active, 'done', !this.pl.nodes[this.active].done)
    },
    toggleSelectedDone: function () {
      this.actions.batchSet('done', this.selected, this.selected.map((id) => !this.pl.nodes[id].done))
    },
  },
}


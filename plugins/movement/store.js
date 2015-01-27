
module.exports = {
  init: function (store) {
    store.moving = null
  },

  actions: {
    startMoving: function (id) {
      if (id === this.root) return // TODO error?
      this.moving = id
      this.changed('moving')
    },

    doneMoving: function (pid, index) {
      if (!this.moving) return // TODO error?
      var opid = this.db.nodes[this.moving].parent
      this.executeCommand('move', {
        id: this.moving,
        npid: pid,
        nindex: index
      })
      this.changed('node:' + opid, 'node:' + pid) // do I need to add the moved node? probably not
    },
  }
}


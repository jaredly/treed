
module.exports = MemPL

function MemPL() {
  this.data = {}
}

MemPL.prototype = {
  save: function (type, data) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][data.id] = data
  },
  update: function (type, id, update) {
    for (var name in update) {
      this.data[type][id][name] = update[name]
    }
  },
  findAll: function (type, done) {
    var items = []
    if (!this.data[type]) return done(items)
    for (var id in this.data[type]) {
      items.push(this.data[type][id])
    }
    setTimeout(function () {
      done(items)
    }, 0)
    // return items
  },
  remove: function (type, id) {
    delete this.data[type][id]
  }
}


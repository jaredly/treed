
module.exports = MemPL

function MemPL() {
  this.data = {}
}

MemPL.prototype = {
  save: function (type, id, data) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][id] = data
  },
  update: function (type, id, update) {
    for (var name in update) {
      this.data[type][id][name] = update[name]
    }
  },
  findAll: function (type) {
    var items = []
    if (this.data[type]) {
      for (var id in this.data[type]) {
        items.push(this.data[type][id])
      }
    }
    return new Promise(function (res, rej) {
      res(items)
    })
  },
  remove: function (type, id) {
    delete this.data[type][id]
  }
}



module.exports = MemPL

function MemPL() {
  this.data = {}
}

MemPL.prototype = {
  init: function (done) {
    done()
  },
  save: function (type, id, data, done) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][id] = data
    done && done()
  },
  update: function (type, id, update, done) {
    for (var name in update) {
      this.data[type][id][name] = update[name]
    }
    done && done()
  },
  findAll: function (type, done) {
    var items = []
    if (this.data[type]) {
      for (var id in this.data[type]) {
        items.push(this.data[type][id])
      }
    }
    done(null, items)
  },
  remove: function (type, id, done) {
    delete this.data[type][id]
    done && done()
  }
}


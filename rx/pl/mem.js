
module.exports = Mem

function Mem(options) {
  this.o = options
  this.data = {}
}

Mem.prototype = {
  findAll: function (type, done) {
    var res = []
    if (!this.data[type]) return done(null, res)
    for (var id in this.data[type]) {
      res.push(this.data[type][id])
    }
    done(null, res)
  },
  save: function (type, id, value) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][id] = value
  },
  set: function (type, id, attr, value) {
    this.data[type][id][attr] = value
  },
  batchSet: function (type, attr, ids, values) {
    for (var i=0; i<ids.length; i++) {
      this.data[type][ids[i]][attr] = values[i]
    }
  },
  update: function (type, id, update) {
    for (var name in update) {
      this.data[type][id][name] = update[name]
    }
  },
  remove: function (type, id) {
    delete this.data[type][id]
  },
}


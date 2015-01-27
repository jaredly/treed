
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
  save: function (type, id, value, done) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    this.data[type][id] = value
    done && done()
  },
  set: function (type, id, attr, value, done) {
    this.data[type][id][attr] = value
    done && done()
  },
  batchSave: function (type, nodes, done) {
    if (!this.data[type]) {
      this.data[type] = {}
    }
    for (var id in nodes) {
      this.data[type][id] = nodes[id]
    }
    done && done()
  },
  batchSet: function (type, attr, ids, value, done) {
    if (Array.isArray(value)) {
      for (var i=0; i<ids.length; i++) {
        this.data[type][ids[i]][attr] = value[i]
      }
    } else {
      for (var i=0; i<ids.length; i++) {
        this.data[type][ids[i]][attr] = value
      }
    }
    done && done()
  },
  update: function (type, id, update, done) {
    for (var name in update) {
      this.data[type][id][name] = update[name]
    }
    done && done()
  },
  remove: function (type, id, done) {
    delete this.data[type][id]
    done && done()
  },
}


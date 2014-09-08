
module.exports = Local

function Local(opts) {
  this.prefix = (opts.prefix || 'local') + ':'
}

Local.prototype = {
  findAll: function (type, done) {
    var found = []
      , prefix = this.prefix + type + ':'
    for (var name in localStorage) {
      if (name.slice(0, prefix.length) !== prefix) continue;
      found.push(JSON.parse(localStorage[name]))
    }
    done(null, found)
  },
  save: function (type, id, value) {
    localStorage.setItem(this.prefix + type + ':' + id, JSON.stringify(value))
  },
  load: function (type, id) {
    return JSON.parse(localStorage[this.prefix + type + ':' + id])
  },
  set: function (type, id, attr, value) {
    var val = this.load(type, id)
    val[attr] = value
    this.save(type, id, val)
  },
  batchSet: function (type, attr, ids, values) {
    for (var i=0; i<ids.length; i++) {
      this.set(type, ids[i], attr, values[i])
    }
  },
  update: function (type, id, update) {
    var val = this.load(type, id)
    for (var name in update) {
      val[name] = update[name]
    }
    this.save(type, id, val)
  },
  remove: function (type, id) {
    delete localStorage[this.prefix + type + ':' + id]
  },
}




module.exports = LocalPL

function LocalPL(opts) {
  this.prefix = (opts.prefix || 'local') + ':'
}

LocalPL.prototype = {
  init: function (done) {
    // XXX: are there any potential errors?
    done()
  },
  remote: false,
  canTrackUpdates: false,

  listen: function (type, add, change) {
    // noop
  },

  save: function (type, id, data, done) {
    localStorage[this.prefix + type + ':' + id] = JSON.stringify(data)
    done && done()
  },

  find: function (type, id, done) {
    var data
    try {
      data = JSON.parse(localStorage[this.prefix + type + ':' + id])
    } catch (e) {
      return done(e)
    }
    done(null, data)
  },

  update: function (type, id, update, done) {
    this.find(type, id, function (err, node) {

      if (err) return done(err)
      for (var attr in update) {
        node[attr] = update[attr]
      }
      this.save(type, id, node, done)
    }.bind(this))
  },

  remove: function (type, id, done) {
    delete localStorage[this.prefix + type + ':' + id]
    done && done()
  },

  findAll: function (type, done) {
    var items = []
      , data
    for (var key in localStorage) {
      if (key.indexOf(this.prefix + type + ':') !== 0) {
        continue;
      }
      try {
        data = JSON.parse(localStorage[key])
      } catch (e) {
        return done(e)
      }
      items.push(data)
    }
    done(null, items)
  },

  load: function (data, done, clear) {
    if (clear) {
      for (var key in localStorage) {
        if (key.indexOf(this.prefix) !== 0) {
          continue;
        }
        delete localStorage[key]
      }
    }
    for (var id in data.nodes) {
      localStorage[this.prefix + id] = JSON.stringify(data.nodes[id])
    }
    done && done()
  },

  dump: function (done) {
    var data = {}
      , item
    for (var key in localStorage) {
      if (this.prefix && key.indexOf(this.prefix) !== 0) {
        continue;
      }
      try {
        item = JSON.parse(localStorage[key])
      } catch (e) {
        console.warn("Failed to parse item", key, "while dumping")
        continue;
      }
      data[key.slice(this.prefix.length)] = item
    }
    done(null, {nodes: data})
  }
}


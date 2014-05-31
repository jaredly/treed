
module.exports = LocalPL

function LocalPL(prefix) {
  this.prefix = prefix ? (prefix + ':') : ''
}

LocalPL.prototype = {
  init: function (done) {
    // XXX: are there any potential errors?
    done()
  },
  remote: false,
  canTrackUpdates: false,
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
      for (var name in update) {
        node[name] = update[name]
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
    for (var name in localStorage) {
      if (name.indexOf(this.prefix + type + ':') !== 0) {
        continue;
      }
      try {
        data = JSON.parse(localStorage[name])
      } catch (e) {
        return done(e)
      }
      items.push(data)
    }
    done(null, items)
  },
  load: function (data, done, clear) {
    if (clear) {
      for (var name in localStorage) {
        if (name.indexOf(this.prefix) !== 0) {
          continue;
        }
        delete localStorage[name]
      }
    }
    for (var name in data.nodes) {
      localStorage[this.prefix + name] = JSON.stringify(data.nodes[name])
    }
    done && done()
  },
  dump: function (done) {
    var data = {}
      , item
    for (var name in localStorage) {
      if (this.prefix && name.indexOf(this.prefix) !== 0) {
        continue;
      }
      try {
        item = JSON.parse(localStorage[name])
      } catch (e) {
        console.warn("Failed to parse item", name, "while dumping")
        continue
      }
      data[name.slice(this.prefix.length)] = item
    }
    done(null, {nodes: data})
  }
}


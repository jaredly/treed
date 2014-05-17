
module.exports = LocalPL

function LocalPL() {
}

LocalPL.prototype = {
  init: function (done) {
    // XXX: are there any potential errors?
    done()
  },
  remote: false,
  canTrackUpdates: false,
  save: function (type, id, data, done) {
    localStorage[type + ':' + id] = JSON.stringify(data)
    done && done()
  },
  find: function (type, id, done) {
    var data
    try {
      data = JSON.parse(localStorage[type + ':' + id])
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
    delete localStorage[type + ':' + id]
    done && done()
  },
  findAll: function (type, done) {
    var items = []
      , data
    for (var name in localStorage) {
      if (name.indexOf(type + ':') !== 0) {
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
}


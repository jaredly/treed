
module.exports = LocalPL

function LocalPL() {
}

LocalPL.prototype = {
  save: function (type, data) {
    console.log('saving', type, data)
    localStorage[type + ':' + data.id] = JSON.stringify(data)
  },
  find: function (type, id) {
    return JSON.parse(localStorage[type + ':' + id])
  },
  update: function (type, id, update) {
    var node = this.find(type, id)
    console.log('updating!', type, id, update, node)
    for (var name in update) {
      node[name] = update[name]
    }
    this.save(type, node)
  },
  remove: function (type, id) {
    console.log('removing', type, id)
    delete localStorage[type + ':' + id]
  },
  findAll: function (type, done) {
    var items = []
    for (var name in localStorage) {
      if (name.indexOf(type + ':') !== 0) {
        continue;
      }
      items.push(JSON.parse(localStorage[name]))
    }
    setTimeout(function () {
      console.log('foudn', items)
      done(items)
    }, 0)
  },
}


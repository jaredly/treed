
var Promise = require('bluebird')

module.exports = LocalPL

function LocalPL() {
}

LocalPL.prototype = {
  save: function (type, id, data) {
    console.log('saving', type, data)
    localStorage[type + ':' + id] = JSON.stringify(data)
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
  findAll: function (type) {
    var items = []
    for (var name in localStorage) {
      if (name.indexOf(type + ':') !== 0) {
        continue;
      }
      items.push(JSON.parse(localStorage[name]))
    }
    return new Promise(function (res, rej) {
      res(items)
    })
  },
}



module.exports = DumbPL

function DumbPL() {
  this.data = {}
}

DumbPL.prototype = {
  listen: function (type, add, change) {
  },
  save: function (type, id, data) {
  },
  update: function (type, id, update) {
  },
  findAll: function (type) {
    return new Promise(function (res, rej) {
      res([])
    })
  },
  remove: function (type, id) {
  }
}


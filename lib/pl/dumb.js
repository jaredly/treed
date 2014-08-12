
module.exports = DumbPL

function DumbPL() {
  this.data = {}
}

DumbPL.prototype = {
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



var request = require('superagent-browserify')

module.exports = RestPL

function RestPL(host) {
  this.host = host || 'http://localhost:3000'
}

RestPL.prototype = {
  save: function (type, id, data, done) {
    request.post(this.host + '/' + type + '/' + id)
      .send(data)
      .end(function (err, res) {
        done && done(err)
      })
  },
  find: function (type, id, done) {
    request.get(this.host + '/' + type + '/' + id)
      .end(function (err, res) {
        done(err, res && res.body)
      })
  },
  findAll: function (type, done) {
    request.get(this.host + '/' + type + '/')
      .end(function (err, res) {
        done(err, res && res.body)
      })
  },
  remove: function (type, id, done) {
    request.del(this.host + '/' + type + '/' + id)
      .end(function (err, res) {
        done && done(err) // , res && res.body)
      })
  },
  update: function (type, id, data, done) {
    request.put(this.host + '/' + type + '/' + id)
      .send(data)
      .end(function (err, res) {
        done && done(err) // , res && res.body)
      })
  }
}


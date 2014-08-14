
var PouchDB = require('pouchdb')
var Base = require('./base')

module.exports = Pouch

function Pouch(options) {
  this.o = options || {}
}

Base.extend(Pouch, {
  init: function (done) {
    this.db = new PouchDB(this.o.name || 'pouchlocal')
    done()
  },

  save: function (type, id, data, done) {
    // can I do namespacing for different types? Looks like I might have to
    // fake it.
  },
  // do all the right things
})


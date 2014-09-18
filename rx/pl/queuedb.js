
module.exports = Queue

function Queue(db) {
  this.db = db
  this._queue = []
  //var ops = 'save set batchSave batchSet update remove'
}

Queue.prototype = {
  findAll: function () {
    return this.db.findAll.apply(this.db, arguments)
  },

  opper: function (name, args, done) {
    this._queue.push([name, args, done])
    console.log('push', this._queue.length, name, args)
    if (!this.busy) {
      this.advance()
    }
  },

  advance: function () {
    if (!this._queue.length) {
      this.busy = false
      return
    }
    this.busy = true
    var item = this._queue.shift()
    console.log('pop', this._queue.length, item[0], item[1])
    this.db[item[0]].apply(this.db, item[1].concat([function (err) {
      if (err) console.error('DB ERROR', err)
      this.advance()
      if (item[2]) item[2].apply(null, arguments)
    }.bind(this)]))
  },

  save: function (type, id, value, done) {
    this.opper('save', [type, id, value], done)
  },

  set: function (type, id, attr, value, done) {
    this.opper('set', [type, id, attr, value], done)
  },

  batchSave: function (type, nodes, done) {
    this.opper('batchSave', [type, nodes], done)
  },

  batchSet: function (type, attr, ids, value, done) {
    this.opper('batchSet', [type, attr, ids, value], done)
  },

  update: function (type, id, update, done) {
    this.opper('update', [type, id, update], done)
  },

  remove: function (type, id, done) {
    this.opper('remove', [type, id], done)
  },
}



var levelup = require('levelup')
  , sublevel = require('sublevel')
  , async = require('async')

module.exports = Level

function Level(backend, opts) {
  this.prefix = (opts && opts.prefix || 'ixdb') + ':'
  this._db = sublevel(levelup(this.prefix, {
    db: backend,
    valueEncoding: 'json'
  }))
  this._subs = {}
}

Level.prototype = {
  findAll: function (type, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    var nodes = []
    this._subs[type].createValueStream()
      .on('data', (data) => nodes.push(data))
      .on('error', (err) => done(err))
      .on('end', () => done(null, nodes))
  },

  save: function (type, id, value, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    this._subs[type].put(id, value, done)
  },

  set: function (type, id, attr, value, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    this._subs[type].get(id, (err, val) => {
      if (err) return done(err)
      val[attr] = value
      this._subs[type].put(id, val, done)
    })
  },

  batchSave: function (type, nodes, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    var ops = []
    for (var id in nodes) {
      ops.push({type: 'put', key: id, value: nodes[id]})
    }
    this._subs[type].batch(ops, done)
  },

  batchSet: function (type, attr, ids, value, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    var gets = {}
    ids.forEach((id) => gets[id] = (next) => this._subs[type].get(id, next))
    async.parallel(gets, (err, items) => {
      if (err) return done(err)
      console.log(items, ids)
      var ops = ids.map((id, i) => {
        var node = items[id]
        if (Array.isArray(value)) {
          node[attr] = value[i]
        } else {
          node[attr] = value
        }
        return {type: 'put', key: id, value: node}
      })
      console.log('batch-set', ops)
      this._subs[type].batch(ops, done)
    })
    /*
    this._subs[type].
    if (Array.isArray(value)) {
      for (var i=0; i<ids.length; i++) {
        this.set(type, ids[i], attr, value[i])
      }
    } else {
      for (var i=0; i<ids.length; i++) {
        this.set(type, ids[i], attr, value)
      }
    }
    */
  },

  update: function (type, id, update, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    this._subs[type].get(id, (err, val) => {
      if (err) return done(err)
      for (var name in update) {
        val[name] = update[name]
      }
      this._subs[type].put(id, val, done)
    })
  },

  remove: function (type, id, done) {
    if (!this._subs[type]) {
      this._subs[type] = this._db.sublevel(type)
    }
    this._subs[type].del(id, done)
  },
}



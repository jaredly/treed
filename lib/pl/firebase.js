
module.exports = FirePL

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'
function uuid(ln) {
  ln = ln || 32
  var id = ''
  for (var i=0; i<ln; i++) {
    id += CHARS[parseInt(Math.random() * CHARS.length)]
  }
  return id
}

function FirePL(options) {
  this.db = new Firebase(options.url);
  this.data = {}
}

FirePL.prototype = {
  init: function (done) {
    var id = uuid();
    this._userid = id
    this.db.once('value', function (snapshot) {
      this.data = snapshot.val()
      var user = this.db.child('users').child(id)
      user.set({selection: false})
      user.onDisconnect().remove()
      done();
    }.bind(this))
  },

  listen: function (type, onAdd, onChanged) {
    this.db.child(type).on('child_changed', function (snapshot) {
      var id = snapshot.name()
      var data = snapshot.val()
      this.data[type][id] = data
       onChanged(id, data)
    }.bind(this))

    this.db.child(type).on('child_added', function (snapshot) {
      var id = snapshot.name()
      var data = snapshot.val()
      this.data[type][id] = data
      onAdd(id, data)
    }.bind(this))
  },

  save: function (type, id, data, done) {
    this.data[type][id] = data
    this.db.child(type).child(id).set(data, done)
  },

  update: function (type, id, update, done) {
    this.db.child(type).child(id).update(update, done)
  },

  findAll: function (type, done) {
    this.db.child(type).once('value', function (snapshot) {
      var items = []
      var val = snapshot.val()
      for (var name in val) {
        items.push(val[name])
      }
      done(null, items)
    })
  },

  remove: function (type, id, done) {
    this.db.child(type).child(id).remove(done)
  },

  load: function (data, done, clear) {
  },

  dump: function (done) {
  },
}


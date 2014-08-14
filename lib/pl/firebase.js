
var Base = require('./base')
var uuid = require('../uuid')

module.exports = FirePL

var COLORS = '#42b9bd #a405fa #7e6c93 #fee901 #a8ff99'.split(' ')
function randColor() {
  return COLORS[parseInt(Math.random() * COLORS.length)]
}

function FirePL(options) {
  this.db = new Firebase(options.url);
  this.data = {}
}

Base.extend(FirePL, {
  init: function (done) {
    var id = uuid();
    this._userid = id
    this.db.once('value', function (snapshot) {
      this.data = snapshot.val()
      var user = this.db.child('users').child(id)
      user.set({selection: false, color: randColor()})
      user.onDisconnect().remove()
      done();
    }.bind(this))

    var users = this.db.child('users')
    users.on('child_added', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('addActive', id, user)
    }.bind(this))

    users.on('child_changed', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('changeActive', id, user)
    }.bind(this))

    users.on('child_removed', function (snapshot) {
      var id = snapshot.name()
      var user = snapshot.val()
      if (id === this._userid) user.self = true
      this.emit('removeActive', id, user)
    }.bind(this))
  },

  setPresence: function (selection) {
    this.db.child('users').child(this._userid).update({
      // todo usernames
      selection: selection
    })
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
})


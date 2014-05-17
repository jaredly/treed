
module.exports = DropboxPL

function DropboxPL() {
}

DropboxPL.prototype = {
  init: function (done) {
    this.client = new Dropbox.Client({key: APP_KEY});

    // Try to finish OAuth authorization.
    this.client.authenticate({interactive: false}, function (error) {
        if (error) {
            return done(new Error('Authentication error: ' + error))
        }
        this.client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
          if (error) {
            return done(new Error('Error opening default datastore: ' + error))
          }
          // Now you have a datastore. The next few examples can be included here.
          this.store = datastore
          done()
        }.bind(this));
    }.bind(this));

    if (this.client.isAuthenticated()) {
      done()
    }
  },
  _get: function (type, id) {
    var res = this.store.getTable(type).query({_id: id})
    return res && res[0]
  },
  _getAll: function (type) {
    return this.store.getTable(type).query()
  },
  _create: function (type, id, data) {
    data._id = id
    return this.store.getTable(type).insert(data)
  },
  save: function (type, id, data, done) {
    var record = this._get(type, id)
    if (!record) {
      record = this._create(type, id, data)
    } else {
      record.update(data)
    }
    done && done()
  },
  find: function (type, id, done) {
    var record = this._get(type, id)
    if (!record) return done && done(new Error('item not found'))
    done && done(null, record.getFields())
  },
  findAll: function (type, done) {
    return done(null, this._getAll(type).map(function (record) {
      return record.getFields()
    }))
  },
  remove: function (type, id, done) {
    var record = this._get(type, id)
    if (!record) return done && done()
    record.deleteRecord()
    done && done()
  },
  update: function (type, id, update, done) {
    var record = this._get(type, id)
    if (!record) return done && done(new Error('item not found'))
    record.update(update)
    done && done()
  },
}

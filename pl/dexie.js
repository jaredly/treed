
const Dexie = window.Dexie

module.exports = class DexieBack {
  constructor(opts) {
    const prefix = (opts && opts.prefix || 'dexie')
    const db = this._db = new Dexie(prefix)
    db.version(1).stores({
      node: 'id, parent',
      root: 'id',
    })
  }

  init() {
    return this._db.open()
  }

  findAll(type, done) {
    this._db[type].toArray().then(
      val => done(null, val),
      err => done(err)
    )
  }

  save(type, id, value, done) {
    this._db[type].put(value)
      .then(
        () => done(),
        err => done(err)
      )
  }

  set(type, id, attr, value, done) {
    this._db[type].update(id, {[attr]: value})
      .then(
        () => done(),
        err => done(err)
      )
  }

  batchSave(type, nodes, done) {
    this._db.transaction('rw', this._db[type], () => {
      Object.keys(nodes).forEach(id => {
        this._db[type].put(nodes[id])
      })
    }).then(
      () => done(),
      err => done(err)
    )
  }

  batchSet(type, attr, ids, value, done) {
    this._db.transaction('rw', this._db[type], () => {
      if (Array.isArray(value)) {
        ids.forEach((id, i) => {
          this._db[type].update(id, {[attr]: value[i]})
        })
      } else {
        ids.forEach(id => {
          this._db[type].update(id, {[attr]: value})
        })
      }
    }).then(
      () => done(),
      err => done(err)
    )
  }

  update(type, id, update, done) {
    this._db[type].update(id, update)
      .then(
        () => done(),
        err => done(err)
      )
  }

  remove(type, id, done) {
    this._db[type].delete(id)
      .then(
        () => done(),
        err => done(err)
      )
  }
}



var uuid = require('../lib/uuid')

module.export = Db

function Db(pl) {
  this.nodes = {}
  this.pl = pl
}

Db.prototype = {
  init: function (done) {
    this.pl.findAll('root', (err, roots) => {
      if (err) return done(err)
      if (!roots.length) return this.makeRoot(done)
      this.root = roots[0].id
      this.pl.findAll('node', (err, nodes) => {
        if (err) return done(err)
        nodes.forEach((node) => {
          this.nodes[node.id] = node
        })

        done()
      })
    })
  },

  makeRoot: function (done) {
    this.root = uuid()
    this.pl.save('root', this.root, {id: this.root})
    this.nodes = {}
    this.nodes[this.root] = {
      id: this.root,
      children: []
    }
  },

  set: function (id, attr, value) {
    this.nodes[id][attr] = value
    this.pl.set('node', id, attr, value)
  },

  batchSet: function (attr, ids, values) {
    ids.forEach((id, i) => {
      this.nodes[id][attr] = values[i]
    })
    this.pl.batchSet('node', attr, ids, values)
  },

  update: function (id, update) {
    for (var name in update) {
      this.nodes[id][name] = update[name]
    }
    this.pl.update('node', id, update)
  },

}

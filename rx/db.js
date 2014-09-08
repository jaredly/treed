
var uuid = require('../lib/uuid')

module.exports = Db

function Db(pl) {
  this.nodes = {}
  this.pl = pl
}

Db.prototype = {
  init: function (defaultData, done) {
    this.pl.findAll('root', (err, roots) => {
      if (err) return done(err)
      if (!roots.length) return this.makeRoot(defaultData, done)
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

  create: function (pid, ix, content, type) {
    var id = uuid()
    this.save(id, {
      id: id,
      content: content || '',
      type: type || 'base',
      children: [],
      parent: pid,
    })
    this.insertChild(pid, id, ix)
    return id
  },

  dump: function (pid, children) {
    var ids = children.map((child) => {
      var id = uuid()
      var node = {
        id: id,
        content: child.content,
        children: [],
        parent: pid,
      }
      for (var name in child) {
        if (['content', 'children'].indexOf(name) !== -1) continue;
        node[name] = child[name]
      }
      this.save(id, node)
      if (child.children && child.children.length) {
        this.dump(id, child.children)
      }
      return id
    })
    this.set(pid, 'children', ids)
  },

  makeRoot: function (defaultData, done) {
    this.root = uuid()
    this.pl.save('root', this.root, {id: this.root})
    this.nodes = {}
    this.nodes[this.root] = {
      id: this.root,
      content: 'Home',
      parent: null,
      children: []
    }
    this.pl.save('node', this.root, this.nodes[this.root])
    this.dump(this.root, defaultData)
    done()
  },

  save: function (id, value) {
    this.nodes[id] = value
    this.pl.save('node', id, value)
  },

  set: function (id, attr, value) {
    this.nodes[id][attr] = value
    this.pl.set('node', id, attr, value)
  },

  remove: function (id) {
    delete this.nodes[id]
    this.pl.remove('node', id)
  },

  removeMany: function (ids) {
    ids.forEach(this.remove.bind(this))
  },

  saveMany: function (nodes) {
    nodes.forEach((node) => this.save(node.id, node))
  },

  // returns the old index
  removeChild: function (pid, id, count) {
    count = count || 1
    var ix = this.nodes[pid].children.indexOf(id)
    if (ix === -1) return -1
    var ch = this.nodes[pid].children.slice()
    ch.splice(ix, count)
    this.set(pid, 'children', ch)
    return ix
  },

  insertChild: function (pid, id, ix) {
    var ch = this.nodes[pid].children.slice()
    ch.splice(ix, 0, id)
    this.set(pid, 'children', ch)
    return ix
  },

  insertChildren: function (pid, ids, ix) {
    var ch = this.nodes[pid].children.slice()
    ch.splice.apply(ch, [ix, 0].concat(ids))
    this.set(pid, 'children', ch)
    return ix
  },

  setMany: function (attr, ids, values) {
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

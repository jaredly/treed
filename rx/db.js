
var uuid = require('../lib/uuid')
var verifyNodes = require('./util/verify-nodes')

module.exports = Db

function Db(pl, plugins) {
  this.nodes = {}
  this.pl = pl
  this.plugins = plugins || []
  this.addNewNodeAttrs = []
  plugins.forEach((plugin) => {
    if (plugin.addNewNodeAttrs) {
      this.addNewNodeAttrs.push(plugin.addNewNodeAttrs)
    }
  })
  if (!this.addNewNodeAttrs.length) {
    this.addNewNodeAttrs = false
  }
}

Db.prototype = {
  init: function (defaultData, done) {
    this.pl.findAll('root', (err, roots) => {
      if (err) return done(err)
      if (!roots.length) return this.makeRoot(defaultData, done)
      this.root = roots[0].id
      this.pl.findAll('node', (err, nodes) => {
        if (err) return done(err)
        var map = {}
        nodes.forEach((node) => map[node.id] = node)
        var err = verifyNodes(this.root, map)
        if (err) {
          return done(err)
        }
        this.nodes = map

        done()
      })
    })
  },

  create: function (pid, ix, content, type) {
    var id = uuid()
    var node = {
      id: id,
      content: content || '',
      type: type || 'base',
      children: [],
      parent: pid,
    }
    if (this.addNewNodeAttrs) {
      this.addNewNodeAttrs.map(fn => fn(node))
    }
    this.save(id, node)
    this.insertChild(pid, id, ix)
    return id
  },

  // dump children INTO the pid at index ix
  dump: function (pid, children, ix, done) {
    var nodes = {}
    var processChild = (pid, child) => {
      var id = uuid()
      var node = {
        id: id,
        content: child.content,
        children: [],
        parent: pid,
      }
      nodes[id] = node
      for (var name in child) {
        if (['content', 'children'].indexOf(name) !== -1) continue;
        node[name] = child[name]
      }
      if (child.children && child.children.length) {
        node.children = child.children.map(processChild.bind(this, id))
      }
      return id
    }
    var ids = children.map(processChild.bind(this, pid))
    this.batchSave(nodes, (err) => {
      if (err) return done(err)
      var oldChildren = this.nodes[pid].children
      if (!ix && ix !== 0) {
        children = oldChildren.concat(ids)
      } else {
        children = oldChildren.slice()
        ;[].splice.apply(children, [ix, 0].concat(ids))
      }
      this.set(pid, 'children', children, (err) => {
        done(err, {ids: ids, oldChildren: oldChildren})
      })
    })
  },

  exportTree: function (pid) {
    pid = pid || this.root
    var node = this.nodes[pid]
      , out = {}
    for (var name in node) {
      out[name] = node[name]
    }
    out.children = node.children.map(this.exportTree.bind(this))
    delete out.id
    delete out.parent
    return out
  },

  exportMany: function (ids) {
    return ids.map(this.exportTree.bind(this))
  },

  makeRoot: function (defaultData, done) {
    this.root = uuid()
    this.pl.save('root', this.root, {id: this.root}, (err) => {
      if (err) return done(err)
      this.nodes = {}
      this.nodes[this.root] = {
        id: this.root,
        content: defaultData.content || 'Home',
        parent: null,
        children: []
      }
      this.pl.save('node', this.root, this.nodes[this.root], (err) => {
        if (err) return done(err)
        this.dump(this.root, defaultData.children, null, done)
      })
    })
  },

  batchSave: function (nodes, done) {
    for (var id in nodes) {
      this.nodes[id] = nodes[id]
    }
    this.pl.batchSave('node', nodes, done)
  },

  save: function (id, value) {
    this.nodes[id] = value
    this.pl.save('node', id, value)
  },

  set: function (id, attr, value, done) {
    this.nodes[id][attr] = value
    this.pl.set('node', id, attr, value, done)
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

  setMany: function (attr, ids, value, done) {
    if (Array.isArray(value)) {
      ids.forEach((id, i) => {
        this.nodes[id][attr] = value[i]
      })
    } else {
      ids.forEach((id, i) => {
        this.nodes[id][attr] = value
      })
    }
    this.pl.batchSet('node', attr, ids, value, done)
  },

  update: function (id, update, done) {
    for (var name in update) {
      this.nodes[id][name] = update[name]
    }
    this.pl.update('node', id, update, done)
  },
}

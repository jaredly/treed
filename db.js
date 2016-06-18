
var uuid = require('./lib/uuid')
var verifyNodes = require('./util/verify-nodes')
var treesToMap = require('./util/trees-to-map')

module.exports = Db

function Db(pl, plugins) {
  this.nodes = {}
  this.pl = pl
  if (pl.setupTypes) {
    pl.setupTypes(['node'])
  }
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
    var now = Date.now()
    var node = {
      id: id,
      created: now,
      modified: now,
      collapsed: true,
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
    var mapped = treesToMap(children, pid, true)
    this.batchSave(mapped.nodes, (err) => {
      if (err) return done(err)
      var oldChildren = this.nodes[pid].children
      if (!ix && ix !== 0) {
        children = oldChildren.concat(mapped.roots)
      } else {
        children = oldChildren.slice()
        ;[].splice.apply(children, [ix, 0].concat(mapped.roots))
      }
      this.set(pid, 'children', children, (err) => {
        done(err, {ids: mapped.roots, oldChildren: oldChildren})
      })
    })
  },

  exportTree: function (pid, keepIds) {
    pid = pid || this.root
    var node = this.nodes[pid]
      , out = {id: pid}
    for (var name in node) {
      out[name] = node[name]
    }
    out.children = node.children.map(id => this.exportTree(id, keepIds))
    if (!keepIds) delete out.id
    delete out.parent
    return out
  },

  exportMany: function (ids, keepIds) {
    return ids.map(id => this.exportTree(id, keepIds))
  },

  makeRoot: function (defaultData, done) {
    this.root = defaultData && defaultData.id || uuid()
    this.pl.save('root', this.root, {id: this.root}, (err) => {
      if (err) return done(err)
      this.nodes = {}
      var now = Date.now()
      this.nodes[this.root] = {
        id: this.root,
        created: now,
        modified: now,
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
      this.nodes[id].modified = Date.now()
    }
    this.pl.batchSave('node', nodes, done)
  },

  save: function (id, value, modified) {
    this.nodes[id] = value
    this.nodes[id].modified = modified || Date.now()
    this.pl.save('node', id, value)
  },

  set: function (id, attr, value, done) {
    this.nodes[id] = {
      ...this.nodes[id],
      [attr]: value,
      modified: Date.now()
    }
    /*
    this.nodes[id][attr] = value
    this.nodes[id].modified = Date.now()
    */
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
    var now = Date.now()
    const update = {}
    if (Array.isArray(value)) {
      ids.forEach((id, i) => {
        this.nodes[id] = {
          ...this.nodes[id],
          [attr]: value[i],
          modified: now,
        }
        /*
        this.nodes[id][attr] = value[i]
        this.nodes[id].modified = now
        */
        update[id] = this.nodes[id]
      })
    } else {
      ids.forEach((id, i) => {
        this.nodes[id] = {
          ...this.nodes[id],
          [attr]: value,
          modified: now,
        }
        /*
        this.nodes[id][attr] = value
        this.nodes[id].modified = now
        */
        update[id] = this.nodes[id]
      })
    }
    this.pl.batchSave('node', update, done)
    // this.pl.batchSet('node', attr, ids, value, done)
  },

  update: function (id, update, done) {
    this.nodes[id] = {
      ...this.nodes[id],
      ...update,
      modified: Date.now(),
    }
    /*
    for (var name in update) {
      this.nodes[id][name] = update[name]
    }
    this.nodes[id].modified = Date.now()
    */
    this.pl.update('node', id, update, done)
  },
}

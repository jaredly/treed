
module.exports = {
  extend: extend,
  merge: merge,
  ensureInView: ensureInView,
  make_listed: make_listed
}

function merge(a, b) {
  var c = {}
    , d
  for (d in a) {
    c[d] = a[d]
  }
  for (d in b) {
    c[d] = b[d]
  }
  return c
}

function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  if (bb.top < 0) return item.scrollIntoView()
  if (bb.bottom > window.innerHeight) {
    item.scrollIntoView(false)
  }
}

function extend(dest) {
  [].slice.call(arguments, 1).forEach(function (src) {
    for (var attr in src) {
        dest[attr] = src[attr]
    }
  })
  return dest
}

function load(db, tree) {
  var res = make_listed(tree, undefined, true)
  db.save('root', {id: res.id})
  for (var i=0; i<res.tree.length; i++) {
    db.save('node', res.tree[i])
  }
}

function make_listed(data, nextid, collapse) {
  var ids = {}
    , children = []
    , ndata = {}
    , res
    , i
  if (undefined === nextid) nextid = 100

  if (data.children) {
    for (i=0; i<data.children.length; i++) {
      res = make_listed(data.children[i], nextid, collapse)
      for (var id in res.tree) {
        ids[id] = res.tree[id]
        ids[id].depth += 1
      }
      children.push(res.id)
      nextid = res.id + 1
    }
    // delete data.children
  }
  for (var attr in data) {
    if (attr === 'children') continue;
    ndata[attr] = data[attr]
  }
  ndata.done = false
  var theid = data.id || nextid
  ids[theid] = {
    id: theid,
    data: ndata,
    children: children,
    collapsed: !!collapse,
    depth: 0
  }
  for (i=0; i<children.length; i++) {
    ids[children[i]].parent = theid;
  }
  return {id: theid, tree: ids}
}


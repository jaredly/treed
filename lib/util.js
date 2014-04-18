
module.exports = {
  extend: extend,
  merge: merge,
  make_listed: make_listed
}

function merge(a, b) {
  var c = {}
    , name
  for (name in a) {
    c[name] = a[name]
  }
  for (name in b) {
    c[name] = b[name]
  }
  return c
}

function extend(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
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
  for (var name in data) {
    if (name === 'children') continue;
    ndata[name] = data[name]
  }
  ndata.done = false
  ids[nextid] = {
    id: nextid,
    data: ndata,
    children: children,
    collapsed: !!collapse,
    depth: 0
  }
  for (i=0; i<children.length; i++) {
    ids[children[i]].parent = nextid;
  }
  return {id: nextid, tree: ids}
}





function extend(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
}

function make_listed(data, nextid, collapse) {
  var ids = {}
    , children = []
    , ndata = {}
    , res
  if (undefined === nextid) nextid = 100

  if (data.children) {
    for (var i=0; i<data.children.length; i++) {
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
    if (name === 'children') continue
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
  for (var i=0; i<children.length; i++) {
    ids[children[i]].parent = nextid;
  }
  return {id: nextid, tree: ids}
}




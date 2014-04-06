
function extend(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
}

function make_listed(data, nextid) {
  var ids = {}
    , children = []
    , res
  if (!nextid) nextid = 0

  if (data.children) {
    for (var i=0; i<data.children.length; i++) {
      res = make_listed(data.children[i], nextid)
      for (var id in res.tree) {
        ids[id] = res.tree[id]
      }
      children.push(res.id)
      nextid = res.id + 1
    }
    delete data.children
  }
  ids[nextid] = {
    id: nextid,
    data: data,
    children: children
  }
  for (var i=0; i<children.length; i++) {
    ids[children[i]].parent = nextid;
  }
  return {id: nextid, tree: ids}
}


var data = {
  name: 'awesome',
  children: [{
    name: 'food'
  }, {
    name: 'people',
    children: [{
      name: 'my mother',
    }, {
      name: 'your mother'
    }]
  }, {
    name: 'places',
    children: [{
      name: 'bostom',
    }, {
      name: 'germany',
      children: [{
        name: 'Frankfurt'
      }, {
        name: 'Frankfurt temple'
      }, {
        name: 'gladbach'
      }]
    }, {
      name: 'italy'
    }]
  }]
}

var conved = make_listed(data)
  , main = document.getElementById('main')

var listed = new Listed(conved.id, conved.tree, main)


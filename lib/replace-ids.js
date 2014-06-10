
var types = require('./node-types')

function repid(idmap, id) {
  return idmap[id]
}

module.exports = function (id, src, idmap) {
  var dest = {
        id: idmap[id],
        created: src.created,
        modified: src.modified,
        contents: src.contents,
        collapsed: src.collapsed
      }
    , rep = repid.bind(null, idmap)
    , type = types[src.type]
  if (src.children) {
    dest.children = src.children.map(rep)
  }
  if (src.parents) {
    dest.parents = src.parents.map(rep)
  }
  dest.meta = {}
  for (var attr in src.meta) {
    if (type[attr] === 'id') {
      dest.meta[attr] = idmap[src.meta[attr]]
    } else {
      dest.meta[attr] = _.cloneDeep(src.meta[attr])
    }
  }
  return dest
}


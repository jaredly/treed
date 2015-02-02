
module.exports = keys

keys.keyName = keyName

var KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  27: 'escape',
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  113: 'f2',
  186: ';',
  188: 'comma',
  190: '.',
  219: '[',
  221: ']'
}

function keyName(code) {
  if (code <= 90 && code >= 65) {
    return String.fromCharCode(code + 32)
  }
  if (code >= 48 && code <= 57) {
    return String.fromCharCode(code)
  }
  return KEYS[code]
}

function makeLayer(config) {
  var layer = {kmap: {}, prefixes: {}}
    , parts
    , part
    , seq
  for (var key in config) {
    parts = key.split(',')
    for (var i=0;i<parts.length;i++) {
      part = parts[i].trim()
      if (window.DEBUG_KEYS && layer.kmap[part]) {
        console.log('Overrifing key:', part)
      }
      layer.kmap[part] = config[key]
      if (part.indexOf(' ') !== -1) {
        seq = part.split(/\s+/g)
        var n = ''
        for (var j=0; j<seq.length-1; j++) {
          n += seq[j]
          layer.prefixes[n] = true
          n += ' '
        }
      }
    }
  }
  return layer
}

function modKeyName(e) {
  var key = keyName(e.keyCode)
  if (!key) {
    if (window.DEBUG_KEYS) {
      console.log(e.keyCode)
    }
    return null
  }
  if (e.altKey) key = 'alt+' + key
  if (e.shiftKey) key = 'shift+' + key
  if (e.ctrlKey) key = 'ctrl+' + key
  if (e.metaKey) key = 'cmd+' + key
  return key
}

function keys(config) {
  var kmap = {}
    , prefixes = {}
    , cur_prefix = null

    , layer_ids = []
    , layers = {}
    , id = 1

  function addLayer(config) {
    var layer = makeLayer(config)
      , lid = id++
    layer_ids.push(lid)
    layers[lid] = layer
    return lid
  }

  function removeLayer(lid) {
    if (!layers[lid]) return false
    var ix = layer_ids.indexOf(lid)
    layer_ids.splice(ix, 1)
    delete layers[lid]
    return true
  }

  function handleLayer(layer, key) {
    if (layer.kmap[key]) {
      return layer.kmap[key]
    }
    if (layer.prefixes[key]) {
      return key
    } else {
      return null
    }
  }

  function findAction(key) {
    if (cur_prefix) {
      key = cur_prefix.key + ' ' + key
      var got = handleLayer(layers[cur_prefix.lid], key)
      if ('string' === typeof got) {
        cur_prefix.key = got
        return false
      }
      cur_prefix = null
      if (got === null) {
        return true
      }
      return got
    }
    for (var i=layer_ids.length-1; i >= 0; i--) {
      var got = handleLayer(layers[layer_ids[i]], key)
      if (got === null) continue
      if ('string' === typeof got) {
        cur_prefix = {
          key: got,
          lid: layer_ids[i],
        }
        return false
      }
      return got
    }
    return true
  }

  function handler(e) {
    var key = modKeyName(e)
    if (window.DEBUG_KEYS) {
      console.log(key)
    }
    var action = findAction(key)
    if ('function' !== typeof action) return action
    if (action.call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  handler.remove = removeLayer
  handler.add = addLayer
  handler.add(config)
  return handler
}



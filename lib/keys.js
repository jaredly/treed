
module.exports = keys

keys.keyName = keyName

const KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  27: 'escape',
  32: 'space',
  33: 'page-up',
  34: 'page-down',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  58: '0',
  192: '`',
  189: '-',
  187: '=',
  113: 'f2',
  186: ';',
  134: 't', // †

  188: 'comma',
  190: '.',
  191: '/',
  220: '\\',
  219: '[',
  221: ']'
}

const KEY_NAMES = Object.keys(KEYS).map(key => KEYS[key])

const SYNONYMS = {
  esc: 'escape',
  'return': 'enter',
}

const SHIFT_KEYS = {
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  '~': '`',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': '\'',
  '<': ',',
  '>': '.',
  '?': '/',
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

const letters = 'abcdefghijklmnopqrstuvwxyz'

const handleVariants = part => {
  return part.split(' ').map(single => {
    const moded = single.split('+')
    let last = moded.pop()
    if (SHIFT_KEYS[last]) {
      moded.push('shift')
      last = SHIFT_KEYS[last]
    } else if (SYNONYMS[last]) {
      last = SYNONYMS[last]
    } else if (last.toLowerCase() !== last && letters.indexOf(last.toLowerCase()) !== -1) {
      moded.push('shift')
      last = last.toLowerCase()
    } else if (KEY_NAMES.indexOf(last) === -1 && letters.indexOf(last) === -1) {
      console.log('failed to load key: ' + last)
    }
    return moded.concat([last]).join('+')
  }).join(' ')
}

function makeLayer(config) {
  var layer = {kmap: {}, prefixes: {}}
    , parts
    , part
    , seq
  for (var key in config) {
    parts = key.split(',')
    for (var i=0;i<parts.length;i++) {
      part = handleVariants(parts[i].trim())
      if (window.DEBUG_KEYS && layer.kmap[part]) {
        console.log('Overrifing key:', part)
      }
      layer.kmap[part] = config[key]
      if (part.indexOf(' ') !== -1) {
        seq = part.split(/\s+/g)
        var n = ''
        for (var j=0; j<seq.length-1; j++) {
          n += handleVariants(seq[j])
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
  // ORDER OF MODIFIERS:
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
    , disabled = false

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
        return cur_prefix.key
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
        return cur_prefix.key
      }
      return got
    }
    return true
  }

  function handler(e, prefix) {
    if (disabled) return
    const key = modKeyName(e)
    if (window.DEBUG_KEYS) {
      console.log(key)
    }
    if (!key) return
    const action = findAction(key)
    if (prefix && (!cur_prefix || cur_prefix.key !== prefix)) return
    if ('function' !== typeof action) return action
    if (action.call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  handler.clear = function () {cur_prefix = null}
  handler.remove = removeLayer
  handler.add = addLayer
  handler.add(config)
  handler.disable = function () {disabled = true}
  handler.enable = function () {disabled = false}
  return handler
}



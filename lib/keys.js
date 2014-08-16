
module.exports = keys

keys.keyName = keyName

var KEYS = {
  8: 'backspace',
  9: 'tab',
  13: 'return',
  27: 'escape',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  46: 'delete',
  113: 'f2',
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

function keys(config) {
  var kmap = {}
    , prefixes = {}
    , cur_prefix = null
    , parts
    , part
    , seq
  for (var key in config) {
    parts = key.split(',')
    for (var i=0;i<parts.length;i++) {
      part = parts[i].trim()
      kmap[part] = config[key]
      if (part.indexOf(' ') !== -1) {
        seq = part.split(/\s+/g)
        var n = ''
        for (var j=0; j<seq.length-1; j++) {
          n += seq[j]
          prefixes[n] = true
        }
      }
    }
  }
  return function (e) {
    var key = keyName(e.keyCode)
    if (!key) {
      return console.log(e.keyCode)
    }
    if (e.altKey) key = 'alt+' + key
    if (e.shiftKey) key = 'shift+' + key
    if (e.ctrlKey) key = 'ctrl+' + key
    if (e.metaKey) key = 'cmd+' + key
    if (cur_prefix) {
      key = cur_prefix + ' ' + key
      cur_prefix = null
    }
    if (!kmap[key]) {
      if (prefixes[key]) {
        cur_prefix = key
      } else {
        cur_prefix = null
      }
      return
    }
    if (kmap[key].call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }
}



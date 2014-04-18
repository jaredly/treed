
module.exports = keys

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
  return KEYS[code]
}

function keys(config) {
  var kmap = {}
    , prefixes = {}
    , cur_prefix = null
    , parts
    , part
    , seq
  for (var name in config) {
    parts = name.split(',')
    for (var i=0;i<parts.length;i++) {
      part = parts[i].trim()
      kmap[part] = config[name]
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
    var name = keyName(e.keyCode)
    if (!name) {
      return console.log(e.keyCode)
    }
    if (e.altKey) name = 'alt+' + name
    if (e.shiftKey) name = 'shift+' + name
    if (e.ctrlKey) name = 'ctrl+' + name
    if (cur_prefix) {
      name = cur_prefix + ' ' + name
      cur_prefix = null
    }
    if (!kmap[name]) {
      if (prefixes[name]) {
        cur_prefix = name
      } else {
        cur_prefix = null
      }
      return
    }
    if (kmap[name].call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }
}




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
  65: 'a',
  66: 'b',
  67: 'c',
  68: 'd',
  72: 'h',
  73: 'i',
  74: 'j',
  75: 'k',
  76: 'l',
  77: 'm',
  78: 'n',
  79: 'o',
  80: 'p',
  81: 'q',
  82: 'r',
  83: 's',
  84: 't',
  85: 'u',
  86: 'v',
  87: 'w',
  88: 'x',
  89: 'y',
  90: 'z',
  113: 'f2',
  219: '[',
  221: ']'
}

function keys(keys) {
  var kmap = {}
    , parts
  for (var name in keys) {
    parts = name.split(',')
    for (var i=0;i<parts.length;i++) {
      kmap[parts[i].trim()] = keys[name]
    }
  }
  return function (e) {
    if (!KEYS[e.keyCode]) {
      return console.log(e.keyCode)
    }
    var name = KEYS[e.keyCode]
    if (e.altKey) name = 'alt ' + name
    if (e.shiftKey) name = 'shift ' + name
    if (e.ctrlKey) name = 'ctrl ' + name
    if (!kmap[name]) return
    if (kmap[name].call(this, e) !== true) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }
}



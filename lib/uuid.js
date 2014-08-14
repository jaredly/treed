
module.exports = uuid

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'
function uuid(ln) {
  ln = ln || 32
  var id = ''
  for (var i=0; i<ln; i++) {
    id += CHARS[parseInt(Math.random() * CHARS.length)]
  }
  return id
}


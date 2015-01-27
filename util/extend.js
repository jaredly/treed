
module.exports = function (target) {
  for (var i=1; i<arguments.length; i++) {
    for (var name in arguments[i]) {
      target[name] = arguments[i][name]
    }
  }
  return target
}


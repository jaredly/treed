
module.exports = HoodiePL

function HoodiePL() {
  this.hd = new Hoodie()
  for (var i=0; i<fns.length; i++) {
    this[fns[i]] = this.bindOne(fns[i])
  }
}

HoodiePL.prototype = {
}


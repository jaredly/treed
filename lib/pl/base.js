
function merge(a) {
  for (var i=1; i<arguments.length; i++) {
    for (var name in arguments[i]) {
      a[name] = arguments[i][name]
    }
  }
  return a
}

module.exports = Base

function noop() {
  throw new Error("Not implemented!")
}

function Base() {
  this._listeners = {}
}

Base.extend = function (fn, obj) {
  fn.prototype = merge(Object.create(Base.prototype), obj)
  fn.prototype.constructor = fn
}

Base.prototype = {
  init: function (done) {
    done()
  },

  listen: function (type, add, change) {
    // noop
  },

  save: noop,
  update: noop,
  findAll: noop,
  remove: noop,
  load: noop,
  dump: noop,

  // event emitter stuff
  emit: function (evt) {
    var args = [].slice.call(arguments, 1)
    if (!this._listeners[evt]) return false
    for (var i=0; i<this._listeners[evt].length; i++) {
      this._listeners[evt][i].apply(this, args)
    }
  },

  on: function (evt, handler) {
    if (!this._listeners[evt]) {
      this._listeners[evt] = []
    }
    this._listeners[evt].push(handler)
  },

  off: function (evt, handler) {
    if (!this._listeners[evt]) return false
    var i = this._listeners[evt].indexOf(handler)
    if (i === -1) return false
    this._listeners[evt].splice(i, 1)
  },
}


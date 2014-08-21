
var BaseStore = require('./base')

module.exports = TempStore

function TempStore(options) {
  BaseStore.call(this, arguments)

  this.active = null
  this.selected = null

}

TempStore.prototype = merge(Object.create(BaseStore.prototype), {
  constructor: TempStore,

  actions: {
  }
})



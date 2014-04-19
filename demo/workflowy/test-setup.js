
var lib = require('./index.js')
  , util = require('./lib/util')
  , DumbPL = require('./lib/dumb-pl')

window.WFModel = lib.Model
window.WFController = lib.Controller
window.DumbPL = DumbPL
window.util = util


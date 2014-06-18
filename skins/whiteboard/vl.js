
var Root = require('./root');

module.exports = ViewLayer

function ViewLayer() {
  this.blocks = {}
  this.root = null
}

ViewLayer.prototype = {
  makeRoot: function () {
    this.root = document.createElement('div');
  }
}


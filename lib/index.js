
module.exports = {
  Node: require('./default-node'),
  View: require('./view'),
  ViewLayer: require('./dom-vl'),
  Model: require('./model'),
  Controller: require('./controller'),
  pl: {
    Local: require('./local-pl'),
    Mem: require('./mem-pl')
  },
  skins: {
    wf: require('../skins/workflowy'),
    wb: require('../skins/whiteboard')
  }
}


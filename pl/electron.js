
import {ipcRenderer} from 'electron';

let txid = 0;
const ixs = {}
const sendTx = (prefix, action, args, done) => {
  let id = txid++;
  ixs[id] = done
  ipcRenderer.send('db:tx', id, prefix, action, args)
}

if (ELECTRON) {
  ipcRenderer.on('db:tx', (evt, id, ...args) => {
    ixs[id](...args)
    delete ixs[id]
  })
}

module.exports = class ElectronBack {
  constructor(opts) {
    this.prefix = opts.prefix
  }

  init() {
    return Promise.resolve()
  }

  sendTx(action, ...full) {
    let done = full[full.length - 1]
    let args = full.slice(0, -1)
    sendTx(this.prefix, action, args, done)
  }

  findAll(type, done) {
    this.sendTx('findAll', type, done)
  }

  save(type, id, value, done) {
    this.sendTx('save', type, id, value, done)
  }

  set(type, id, attr, value, done) {
    this.sendTx('set', type, id, attr, value, done)
  }

  batchSave(type, nodes, done) {
    this.sendTx('batchSave', type, nodes, done)
  }

  batchSet(type, attr, ids, value, done) {
    this.sendTx('batchSet', type, attr, ids, value, done)
  }

  update(type, id, update, done) {
    this.sendTx('update', type, id, update, done)
  }

  remove(type, id, done) {
    this.sendTx('remove', type, id, done)
  }
}


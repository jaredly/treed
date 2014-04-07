
function copy(one) {
  var two = {}
  for (var name in one) {
    two[name] = one[name]
  }
  return two
}

var commands = {
  newNode: {
    args: ['pid', 'index', 'text'],
    apply: function (db, dom) {
      this.id = db.create(this.pid, this.index, this.text)
      dom.add(this.id, this.pid, this.index)
    },
    undo: function (db, dom) {
      dom.remove(this.id)
      db.remove(this.id)
    }
  },
  changeNode: {
    args: ['id', 'newdata'],
    apply: function (db, dom) {
      this.olddata = copy(db.get(this.id).data)
      db.setData(this.id, this.newdata)
      dom.update(this.id)
    },
    undo: function (db, dom) {
      db.setData(this.id, this.olddata)
      dom.update(this.id)
    }
  },
  remove: {
    args: ['id'],
    apply: function (db, dom) {
      this.saved = db.remove(this.id)
    },
    undo: function (db, dom) {
      db.readd(this.saved)
    }
  },
  move: {
    args: ['id', 'pid', 'index'],
    apply: function (db, dom) {
      this.opid = db.get(this.id).parent
      this.oindex = db.get(this.opid).children.indexOf(this.id)
      db.move(this.id, this.pid, this.index)
    },
    undo: function (db, dom) {
      db.move(this.id, this.opid, this.oindex)
    }
  }
}


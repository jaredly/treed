
var movement = require('./movement')
  , listMovement = require('../list/movement')
  , listActions = require('../list/actions')

module.exports = {

  createBefore: function (id) {
    id = id || this.view.active
    var node = this.db.nodes[id]
      , pos
    if (id === this.view.root) {
      pos = {
        pid: id,
        type: node.type,
        ix: 0
      }
    } else {
      pos = {
        pid: node.parent,
        type: node.type,
        ix: this.db.nodes[node.parent].children.indexOf(id),
      }
    }
    this.executeCommand('create', pos, (err, cmd) => {
      this.edit(cmd.id)
    })
  },

  createAfter: function (id, split, after) {
    id = id || this.view.active
    var node = this.db.nodes[id]
      , pos
    if (id === this.view.root) {
      pos = {
        pid: id,
        type: node.type,
        ix: 0
      }
    } else {
      pos = {
        pid: node.parent,
        type: node.type,
        ix: this.db.nodes[node.parent].children.indexOf(id) + 1,
      }
    }
    if (arguments.length === 3) {
      pos.content = after
      this.executeCommands(
        'set', {
          id,
          attr: 'content',
          value: split,
        },
        'create', pos,
        (err, cmd) => {
          this.editStart(cmd.id)
        }
      )
    } else {
      this.executeCommand('create', pos, (err, cmd) => {
        this.edit(cmd.id)
      })
    }
  },

  joinUp: function () {},
  removeEmpty: function () {},

  moveDown: function (id) {
    id = id || this.view.active
    let ids
    if (this.view.mode === 'visual') {
      ids = this.view.selection
    } else {
      ids = [id]
    }
    var pos = movement.below(ids[ids.length - 1], this.view.root, this.db.nodes)
    if (!pos) return
    this.executeCommand('moveMany', {
      ids,
      npid: pos.pid,
      nextIsRoot: pos.pid === this.view.root,
      nindex: pos.ix,
    })
  },

  moveUp: function (id) {
    id = id || this.view.active
    let ids
    if (this.view.mode === 'visual') {
      ids = this.view.selection
    } else {
      ids = [id]
    }
    var pos = movement.above(ids[ids.length - 1], this.view.root, this.db.nodes)
    this.executeCommand('moveMany', {
      ids,
      npid: pos.pid,
      nextIsRoot: pos.pid === this.view.root,
      nindex: pos.ix,
    })
  },

  goUp: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return this.goRight(id)
    var next = movement.prevSiblingOrCousin(id, this.view.root, this.db.nodes)
    this.setActive(next)
  },

  goDown: function (id) {
    id = id || this.view.active
    var next = movement.nextSiblingOrCousin(id, this.view.root, this.db.nodes)
    if (!next) {
      var ch = this.db.nodes[id].children
      if (ch && ch.length && (!this.db.nodes[id].collapsed || id === this.view.root)) {
        next = ch[ch.length - 1]
      } else {
        return
      }
    }
    this.setActive(next)
  },

  goLeft: listActions.goLeft,

  goToFirstSibling: function (id) {
    id = id || this.view.active
    var first = listMovement.firstSibling(id, this.view.root, this.db.nodes)
    if (first === id) {
      first = movement.prevSiblingOrCousin(id, this.view.root, this.db.nodes)
    }
    this.setActive(first)
  },

  goToLastSibling: function (id) {
    id = id || this.view.active
    var last = listMovement.lastSibling(id, this.view.root, this.db.nodes)
    if (last === id) {
      last = movement.nextSiblingOrCousin(id, this.view.root, this.db.nodes)
    }
    this.setActive(last)
  },

  goRight: function (id) {
    id = id || this.view.active
    var right = movement.right(id, this.view.root, this.db.nodes)
    if (right) this.setActive(right)
  },

  goToNextCousin: function (id) {
    var parent = this.db.nodes[id].parent
      , next
    if (!parent) return false
    next = movement.nextCousin(parent, this.view.root, this.db.nodes)
    this.setActive(next)
  },

  goToNextSibling: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var next = movement.nextSibling(id, this.view.root, this.db.nodes)
    if (!next) {
      var parent = this.db.nodes[id].parent
      next = movement.nextSibling(parent, this.view.root, this.db.nodes)
    }
    if (!next) {
      next = movement.down(id, this.view.root, this.db.nodes)
    }
    this.setActive(next)
  },

  goToSurvivingNeighbor: listActions.goToSurvivingNeighbor,

  remove: function (id) {
    id = id || this.view.active
    if (id === this.view.root) return
    var next, ids
    if (this.view.mode === 'visual') {
      ids = this.view.selection
      next = movement.down(ids[ids.length - 1], this.view.root, this.db.nodes, true)
      this.setMode('normal', true)
    } else {
      ids = [id]
      next = movement.down(id, this.view.root, this.db.nodes, true)
    }
    if (!next) {
      next = movement.up(ids[0], this.view.root, this.db.nodes)
    }
    this.view.active = next
    this.executeCommand('remove', {ids: ids})
    this.changed(this.events.nodeChanged(next))
  },

  // TODO make custom ones
  indent: listActions.indent,
  dedent: listActions.dedent,

}


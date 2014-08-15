/*
 * true => 
 */

module.exports = {
  // not dealing with the active element
  'undo': {
    help: 'Undo the last action',
  },

  'redo': {
    help: 'Undo the last action',
  },

  'cut': {
    help: 'remove the currnetly selected item and place it in the clipboard',
    active: true,
  },

  'copy': {
    help: 'place the currently selected item in the clipboard',
    active: true,
  },

  'paste': {
    help: 'insert the contents of the clipboard, into or below the currently selected item',
    active: true,
  },

  'paste above': {
    help: 'insert the contents of the clipboard above the currently selected item',
    active: true,
  },

  'visual mode': {
    help: 'enter multi-select mode',
    active: '!root',
    action: function () {
      this.setSelection([this.active])
    },
  },

  'change': {
    help: 'clear the contents of this node and start editing',
    active: true,
    action: function () {
      this.vl.body(this.active).setContent('')
      this.vl.body(this.active).startEditing()
    },
  },

  edit: {
    help: 'start editing this node at the end',
    active: true,
    action: function () {
      this.vl.body(this.active).startEditing()
    }
  },

  'edit start': {
    help: 'start editing this node at the start',
    active: true,
    action: function () {
      this.vl.body(this.active).startEditing(true)
    },
  },

  // nav
  'first sibling': {
    help: 'jump to the first sibling',
    active: '!new',
    action: function () {
      var first = this.model.firstSibling(this.active)
      if (undefined === first) return
      this.setActive(first)
    }
  },

  'last sibling': {
    help: 'jump to the last sibling',
    active: '!new',
    action: function () {
      var last = this.model.lastSibling(this.active)
      if (undefined === last) return
      this.setActive(last)
    },
  },

  'jump to top': {
    help: 'jump to the top',
    action: function () {
      this.setActive(this.root)
    },
  },

  'jump to bottom': {
    help: 'jump to the last node',
    action: function () {
      this.setActive(this.model.lastOpen(this.root))
      console.log('bottom')
      // pass
    },
  },

  'up': {
    help: 'go to the previous node',
    active: true,
    action: function () {
      var above
      if (this.active === 'new') {
        above = this.root
      } else {
        var top = this.active
        above = this.model.idAbove(top)
        if (above === undefined) above = top
      }
      if (above === this.root && this.o.noSelectRoot) {
        return
      }
      this.setActive(above)
    },
  },

  'down': {
    help: 'go down to the next node',
    active: '!new',
    action: function () {
      if (this.active === this.root &&
          !this.model.ids[this.root].children.length) {
        return this.setActive('new')
      }
      var top = this.active
        , above = this.model.idBelow(top, this.root)
      if (above === undefined) above = top
      this.setActive(above)
    }
  },

  'left': {
    help: 'go up a level to the parent',
    active: true,
    action: function () {
      if (this.active === null) {
        return this.setActive(this.root)
      }
      if (this.active === 'new') return this.setActive(this.root)
      var left = this.model.getParent(this.active)
      if (undefined === left) return
      this.setActive(left)
    },
  },

  'right': {
    help: 'go down a level to the first child',
    active: '!now',
    action: function () {
      if (this.active === this.root &&
          !this.model.ids[this.root].children.length) {
        return this.setActive('new')
      }
      var right = this.model.getChild(this.active)
      if (this.model.isCollapsed(this.active)) return
      if (undefined === right) return
      this.setActive(right)
    },
  },

  'next sibling': {
    help: 'jump to the next sibling (skipping children)',
    active: '!new',
    action: function () {
      var sib = this.model.nextSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },
  },

  'prev sibling': {
    help: 'jump to the previous sibling (skipping children)',
    active: '!new',
    action: function () {
      var sib = this.model.prevSibling(this.active)
      if (undefined === sib) return
      this.setActive(sib)
    },
  },

  'move to first sibling': {
    help: 'move this node to be the first child if its parent',
    active: '!new',
    action: 'moveToTop'
  },

  'move to last sibling': {
    help: 'move this to be the last child of its parent',
    active: '!new',
    action: 'moveToBottom'
  },

  'new before': {
    help: 'create a node above this one and start editing',
    active: true,
    action: function () {
      this.ctrlactions.addBefore(this.active, '', true)
    }
  },

  'new after': {
    help: 'create a node after this one and start editing',
    active: true,
    action: function () {
      if (this.active === 'new') return this.startEditing()
      this.ctrlactions.addAfter(this.active, '', true)
    },
  },

  // movez!
  'toggle collapse': {
    help: 'toggle collapse',
    active: true,
  },

  'collapse': {
    help: 'collapse the node',
    active: true,
    action: function () {
      this.ctrlactions.toggleCollapse(this.active, true)
    },
  },

  'uncollapse': {
    help: 'expand the node',
    active: true,
    action: function () {
      this.ctrlactions.toggleCollapse(this.active, false)
    }
  },

  'indent': {
    help: 'indent the node',
    active: true,
    action: function () {
      this.ctrlactions.moveRight(this.active)
    },
  },

  'dedent': {
    help: 'dedent the node',
    active: true,
    action: function () {
      this.ctrlactions.moveLeft(this.active)
    },
  },

  'move down': {
    help: 'move the current node down',
    active: true
  },

  'move up': {
    help: 'move the current node up',
    active: true,
  },
}


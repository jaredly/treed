
module.exports = {
  view: null,
  keys: {
    'window left': {
      normal: 'w h, alt+w h, w left, alt+w left',
      insert: 'alt+w h, alt+w left',
      visual: 'w h, alt+w h, alt+w left, w left',
    },
    'window right': {
      normal: 'w l, alt+w l, alt+w right, w right',
      insert: 'alt+w l, alt+w right',
      visual: 'w l, alt+w l, alt+w right, w right',
    },
    /** TODO implemented
    'split': {
      normal: ':split',
      visual: ':split',
    },
    */
  },

  store: {
    actions: {
      /*
      split: function () {
      },
      */
      windowLeft: function () {
        if (undefined === this.view.windowLeft) return
        this.parent.activeView = this.view.windowLeft
        this.changed(this.events.activeViewChanged())
      },
      windowRight: function () {
        if (undefined === this.view.windowRight) return
        this.parent.activeView = this.view.windowRight
        this.changed(this.events.activeViewChanged())
      },
    },
  },
}


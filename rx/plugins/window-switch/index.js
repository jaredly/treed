
module.exports = {
  view: null,
  keys: {
    'window left': {
      normal: 'w h, alt+w h',
      insert: 'alt+w h',
      visual: 'w h, alt+w h',
    },
    'window right': {
      normal: 'w l, alt+w l',
      insert: 'alt+w l',
      visual: 'w l, alt+w l',
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


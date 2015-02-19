
var React = require('react')
var Treed = require('../../classy')
var D3Tree = require('../d3tree')
var keys = require('./keys.js')

window.title = 'Full Soup'

var treed = window.treed = new Treed({
  data: require('./data'),
  plugins: [
    require('../../plugins/clipboard'),
    require('../../plugins/collapse'),
    require('../../plugins/undo'),
    require('../../plugins/done'),
  ]
})

var start = Date.now()

treed.keyManager.listen(window)
treed.initStore().then(() => {
  var props = treed.addView({
    defaultKeys: {
      'go to next sibling or cousin': {
        normal: 'down, j',
      },
      'go to previous sibling or cousin': {
        normal: 'up, k',
      },
      'go left': {
        normal: 'left, h',
      },
      'go right': {
        normal: 'right, l',
      },
      'go to first sibling': {
        normal: 'shift+[',
      },
      'go to last sibling': {
        normal: 'shift+]',
      },
      'edit': {
        normal: 'enter',
      },
      'go up': {
        normal: 'backspace',
      },
      'indent': {
        normal: 'tab, shift+alt+l, shift+alt+right',
      },
      'dedent': {
        normal: 'shift+tab, shift+alt+h, shift+alt+left',
      },
      'move up sibling or cousin': {
        normal: 'shift+alt+up, shift+alt+k',
      },
      'move down sibling or cousin': {
        normal: 'shift+alt+down, shift+alt+j',
      },
      'create sibling after': {
        normal: 'o',
      },
    },
  })

  var storeView = props.store

  var d3tree = window.d3tree = new D3Tree('#tree', {
    onCollapse: (id, val) => {
      storeView.actions.set(id, 'collapsed', val)
      storeView.actions.setActive(id)
    },
    onClickNode: (id) => {
      storeView.actions.change(id)
    },
    circleRad: 15,
    duration: 300,
  })

  function update() {
    d3tree.update(treed.store.db.exportTree(null, true), storeView.view.active)
    upActive()
  }

  function upActive() {
    d3tree.setActive(storeView.view.active)
    if (editing) {
      stopEditing(true)
      startEditing()
    }
  }

  var editing = false
    , editText = null
    , editPos = null
  function startEditing() {
    editing = storeView.view.active
    editText = treed.store.db.nodes[editing].content
    editPos = editText.length
    d3tree.setEditing(editing)
    setText(editText, editText.length)
    setTimeout(function () {
      setText(editText, editText.length)
    }, 100)
    window.addEventListener('keydown', keyDown)
  }

  function stopEditing(suppressMode) {
    if (!editing) return
    if (treed.store.db.nodes[editing].content !== editText) {
      storeView.actions.setContent(editing, editText)
    }
    if (!suppressMode) storeView.actions.normalMode()
    d3tree.setText(editing, editText)
    d3tree.setEditing()
    editText = null
    editPos = null
    editing = false
    window.removeEventListener('keydown', keyDown)
  }

  function keyDown(e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.keyCode === 9) {
      return storeView.actions.createChild()
    }
    if (e.keyCode === 27) {
      return stopEditing()
    }
    if (e.keyCode === 37) { // left arrow
      if (editPos === 0) return
      return setText(editText, editPos - 1)
    }
    if (e.keyCode === 39) { // right arrow
      if (editPos === editText.length) return
      return setText(editText, editPos + 1)
    }
    if (e.keyCode === 13) {
      return storeView.actions.createAfter()
    }
    if (e.keyCode === 8) {
      if (editPos === 0) return
      var text = editText.slice(0, editPos-1) + editText.slice(editPos)
      return setText(text, editPos - 1)
    }
    var chr = keys[e.shiftKey ? 'shift' : 'normal'][e.keyCode]
    if (chr === undefined) return
    setText(editText.slice(0, editPos) + chr + editText.slice(editPos), editPos + 1)
  }

  function setText(text, pos) {
    editText = text
    editPos = pos
    d3tree.setText(editing, text.slice(0, editPos) + '|' + text.slice(editPos))
  }

  treed.on('changed', update)
  treed.on('active-node:' + storeView.view.id, upActive)
  treed.on(storeView.events.modeChanged(), () => {
    var mode = storeView.view.mode
    if (mode === 'insert') {
      startEditing()
    } else {
      stopEditing()
    }
  })
  update()
  upActive()

}).catch(error => {
  alert("Failed to initialize: " + error)
})


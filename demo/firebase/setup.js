
function addSelectionChange(view) {
  var v = view.setActive
  view.setActive = function (selection) {
    var res = v.apply(this, arguments)
    this.emit('selectionChange', selection)
    return res
  }
}

function makeOtherActive(user) {
  var node = document.createElement('div')
  node.className = 'other-active'
  node.title = user.name
  node.style.backgroundColor = user.color
  return node
}

function addUserSelections(domvl) {
  domvl.otherActives = {}
  domvl.activeUsers = {}

  domvl.addOtherActive = function (id, user) {
    if (user.self) return
    var node = makeOtherActive(user)
    this.otherActives[id] = node
    this.activeUsers[id] = user
    if (!this.dom[user.selection]) return
    if (!this.dom[user.selection].present) {
      var present = document.createElement('div')
      present.className = 'other-present'
      this.dom[user.selection].main.appendChild(present)
      this.dom[user.selection].present = present
    }
    this.dom[user.selection].present.appendChild(node)
  }

  domvl.removeOtherActive = function (id, user) {
    var node = this.otherActives[id]
    if (!node) return
    if (node.parentNode) node.parentNode.removeChild(node)
    delete this.otherActives[id]
    delete this.activeUsers[id]
  }

  domvl.changeOtherActive = function (id, user) {
    if (user.self) return
    var node = this.otherActives[id]
    this.activeUsers[id] = user
    if (!node) {
      node = makeOtherActive(user)
      this.otherActives[id] = node
    }
    if (node.parentNode) node.parentNode.removeChild(node)
    if (!this.dom[user.selection]) return
    if (!this.dom[user.selection].present) {
      var present = document.createElement('div')
      present.className = 'other-present'
      this.dom[user.selection].main.appendChild(present)
      this.dom[user.selection].present = present
    }
    this.dom[user.selection].present.appendChild(node)
  }

  var makeNode = domvl.makeNode
  domvl.makeNode = function (id, content, meta, level, bounds) {
    var dom = makeNode.call(this, id, content, meta, level, bounds)
    var present = document.createElement('div')
    present.className = 'other-present'
    this.dom[id].main.appendChild(present)
    this.dom[id].present = present
    for (var uid in this.activeUsers) {
      if (this.activeUsers[uid].selection === id) {
        present.appendChild(this.otherActives[uid])
      }
    }
    return dom
  }
}

demo.preload([
  "https://cdn.firebase.com/js/client/1.0.19/firebase.js"
], function () {
  demo.run({
    title: 'Firebase example',
    pl: new demo.pl.Firebase({
      url: 'https://treed-demo.firebaseio.com'
    }),
    style: ['setup.css']
  }, function (model, controller, view, db) {
    addSelectionChange(view)
    addUserSelections(view.vl)

    view.on('selectionChange', function (id) {
      db.setPresence(id)
    })

    if (db.data.users) {
      for (var id in db.data.users) {
        view.vl.addOtherActive(id, db.data.users[id])
      }
    }

    if (view.active) {
      db.setPresence(view.active)
    }

    db.on('addActive', function (id, user) {
      view.vl.addOtherActive(id, user)
    })

    db.on('changeActive', function (id, user) {
      view.vl.changeOtherActive(id, user)
    })

    db.on('removeActive', function (id, user) {
      view.vl.removeOtherActive(id, user)
    })

  })
})



function Listed(id, ids, node, options) {
  this.id = id
  this.ids = ids
  this.dom = {}
  this.node = node
  this.o = extend({
    node: DefaultNode
  }, options)
  this.nextid = 0
  node.appendChild(this.construct(id))
}

Listed.prototype = {
  nodeChanged: function (id, attr, value) {
    this.ids[id].data[attr] = value
    console.log('change', id, attr, value);
    // TODO: fire off event handlers
  },
  toggleCollapse: function (id, what) {
    if (arguments.length === 1) {
      what = !!this.dom[id].collapsed
    }
    this.dom[id].main.classList[what ? 'add' : 'remove']('collapsed')
    this.dom[id].collapsed = what
    // TODO: event listeners?
  },

  // movement
  idAbove: function (id) {
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return false
    var ix = parent.children.indexOf(id)
    if (ix == 0) {
      return pid
    }
    var previd = parent.children[ix - 1]
    while (this.ids[previd].children &&
           this.ids[previd].children.length &&
          !this.dom[previd].collapsed) {
      previd = this.ids[previd].children[this.ids[previd].children.length - 1]
    }
    return previd
  },
  idBelow: function (id) {
    if (this.ids[id].children &&
        this.ids[id].children.length &&
        !this.dom[id].collapsed) {
      return this.ids[id].children[0]
    }
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    while (ix == parent.children.length - 1) {
      parent = this.ids[parent.parent]
      if (!parent) return false
      ix = parent.children.indexOf(pid)
      pid = parent.id
    }
    return parent.children[ix + 1]
  },

  // actually move
  goUp: function (id) {
    // should I check to see if it's ok?
    var above = this.idAbove(id)
    if (above === false) return
    this.dom[id].body.stopEditing();
    this.dom[above].body.startEditing();
  },
  goDown: function (id, fromStart) {
    var below = this.idBelow(id)
    if (below === false) return
    this.dom[id].body.stopEditing()
    this.dom[below].body.startEditing(fromStart)
  },

  idNew: function (id, text) {
    var pid = this.ids[id].parent
      , node = this.dom[id]
      , parent
      , pid
      , nix
    if (this.ids[id].children &&
        this.ids[id].children.length &&
        !this.dom[id].collapsed) {
      pid = id
      parent = this.ids[id]
      nix = 0
    } else {
      parent = this.ids[pid]
      nix = parent.children.indexOf(id) + 1
    }
    if (!parent) return false
    var nid = this.newNode(text)
      , dom = this.construct(nid)
    parent.children.splice(nix, 0, nid)
    this.ids[nid].parent = pid

    return {
      id: nid,
      pid: pid
    }
  },
  addAfter: function (id, text) {
    var news = this.idNew(id, text)
      , nid = news.id
      , pid = news.pid
      , parent = this.ids[pid]
      , pix = parent.children.indexOf(nid)
      , dom = this.dom[nid].main

    if (pix === parent.children.length - 1) {
      this.dom[pid].ul.appendChild(dom)
    } else {
      var after = this.dom[parent.children[pix + 1]].main
      this.dom[pid].ul.insertBefore(dom, after)
    }
    this.dom[nid].body.startEditing(true)
  },
  remove: function (id, addText) {
    var pid = this.ids[id].parent
    if (!pid) return
    var parent = this.ids[pid]
      , ix = parent.children.indexOf(id)
      , prev
    if (ix === 0) {
      prev = pid
    } else {
      prev = parent.children[ix-1]
    }
    this.dom[pid].ul.removeChild(this.dom[id].main)
    delete this.ids[id]
    delete this.dom[id]
    parent.children.splice(ix, 1)
    if (addText) {
      this.ids[prev].data.name += addText
      this.dom[prev].body.addEditText(addText)
    } else {
      this.dom[prev].body.startEditing()
    }
  },
  newNode: function (text) {
    while (this.ids[this.nextid]) {
      this.nextid += 1
    }
    var id = this.nextid
    this.nextid += 1
    var node = {
      id: id,
      data: {name: text || ''},
      children: []
    }
    this.ids[id] = node
    return id
  },


  /** returns a dom node... **/
  construct: function (id) {
    var node = this.ids[id]
    if (id >= this.nextid) {
      this.nextid = id + 1
    }
    if (!node) return
    var dom = document.createElement('li')
      , body = this.bodyFor(id)
    dom.classList.add('listless__item')
    dom.appendChild(body.node);
    this.dom[id] = {main: dom, body: body}
    if (node.children && node.children.length) {
      var ul = document.createElement('ul')
      this.dom[id].ul = ul
      ul.classList.add('listless__children')
      for (var i=0; i<node.children.length; i++) {
        var child = this.construct(node.children[i])
        if (!child) continue;
        ul.appendChild(child)
      }
      dom.appendChild(ul)
    }
    return dom
  },
  /** returns a dom node **/
  bodyFor: function (id) {
    var node = this.ids[id]
    var dom = new this.o.node(node.data, {
      changed: this.nodeChanged.bind(this, id),
      toggleCollapse: this.toggleCollapse.bind(this, id),
      goUp: this.goUp.bind(this, id),
      goDown: this.goDown.bind(this, id),
      addAfter: this.addAfter.bind(this, id),
      remove: this.remove.bind(this, id)
      // TODO: goUp, goDown, indent, dedent, etc.
    })
    return dom
  }
}


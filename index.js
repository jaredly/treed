
function Listed(id, ids, node, options) {
  this.id = id
  this.ids = ids
  this.dom = {}
  this.node = node
  this.o = extend({
    node: DefaultNode
  }, options)
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
  /** returns a dom node **/
  bodyFor: function (id) {
    var node = this.ids[id]
    var dom = new this.o.node(node.data, {
      changed: this.nodeChanged.bind(this, id),
      toggleCollapse: this.toggleCollapse.bind(this, id),
      goUp: this.goUp.bind(this, id),
      goDown: this.goDown.bind(this, id)
      // TODO: goUp, goDown, indent, dedent, etc.
    })
    return dom
  },
  goUp: function (id) {
    // should I check to see if it's ok?
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    this.dom[id].body.stopEditing();
    var ix = parent.children.indexOf(id)
    if (ix == 0) {
      return this.dom[pid].body.startEditing()
    }
    var previd = parent.children[ix - 1]
    while (this.ids[previd].children &&
           this.ids[previd].children.length &&
          !this.dom[previd].collapsed) {
      previd = this.ids[previd].children[this.ids[previd].children.length - 1]
    }
    this.dom[previd].body.startEditing();
  },
  goDown: function (id) {
    if (this.ids[id].children && this.ids[id].children.length && !this.dom[id].collapsed) {
      this.dom[id].body.stopEditing()
      return this.dom[this.ids[id].children[0]].body.startEditing()
    }
    var pid = this.ids[id].parent
      , parent = this.ids[pid]
    if (!parent) return
    var ix = parent.children.indexOf(id)
    if (ix < parent.children.length - 1) {
      this.dom[id].body.stopEditing()
      return this.dom[parent.children[ix + 1]].body.startEditing()
    }
    while (ix == parent.children.length - 1) {
      parent = this.ids[parent.parent]
      if (!parent) return
      ix = parent.children.indexOf(pid)
      pid = parent.id
    }
    this.dom[id].body.stopEditing()
    this.dom[parent.children[ix + 1]].body.startEditing()
  },
  /** returns a dom node... **/
  construct: function (id) {
    var node = this.ids[id]
    if (!node) return
    var dom = document.createElement('li')
      , body = this.bodyFor(id)
    dom.classList.add('listless__item')
    dom.appendChild(body.node);
    this.dom[id] = {main: dom, body: body}
    if (node.children && node.children.length) {
      var ul = document.createElement('ul')
      ul.classList.add('listless__children')
      for (var i=0; i<node.children.length; i++) {
        var child = this.construct(node.children[i])
        if (!child) continue;
        ul.appendChild(child)
      }
      dom.appendChild(ul)
    }
    return dom
  }
}


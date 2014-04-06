
function defaultNode(data, options) {
  var span = document.createElement('div')
    , input = document.createElement('input')
    , name = data.name
    , editing = false;
  span.classList.add('listless__default-node')
  span.innerText = name
  span.addEventListener('click', function (e) {
    if (editing) return
    editing = true;
    span.innerHTML = '';
    input.value = name;
    span.appendChild(input);
    input.focus();
  })
  input.addEventListener('blur', function () {
    editing = false
    span.removeChild(input)
    name = input.value
    span.innerText = input.value
    options.changed('name', input.value)
  });
  input.addEventListener('keydown', function (e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
      case 37: // left
        break;
      case 38: // up
        break;
      case 39: // right
        break;
      case 40: // down
        break;
      case 9:  // tab
        break;
      case 13: // return
        break;
    }
  })
  return {
    node: span
  }
}

function Listed(id, ids, node, options) {
  this.id = id
  this.ids = ids
  this.dom = {}
  this.node = node
  this.o = extend({
    node: defaultNode
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
    // TODO: event listeners?
  },
  /** returns a dom node **/
  bodyFor: function (id) {
    var node = this.ids[id]
    var dom = this.o.node(node.data, {
      changed: this.nodeChanged.bind(this, id),
      toggleCollapse: this.toggleCollapse.bind(this, id),
      // TODO: goUp, goDown, indent, dedent, etc.
    })
    return dom
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
    // dom.appendChild(this.o.node(node.data))
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


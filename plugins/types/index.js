
function clone(obj) {
  var a = {}
  for (var name in obj) {
    a[name] = obj[name]
  }
  return a
}

function cap(text) {
  return text[0].toUpperCase() + text.slice(1)
}

module.exports = {
  title: 'Set type to',

  keys: function (plugins) {
    var keys = {}
    plugins.forEach((plugin) => {
      if (!plugin.types) return
      for (var name in plugin.types) {
        var sh = plugin.types[name].shortcut || plugin.types[name]
        keys['type ' + name] = {
          title: plugin.types[name].title || name,
          'visual': 't ' + sh + ', alt+t ' + sh,
          'normal': 't ' + sh + ', alt+t ' + sh,
          'insert': 'alt+t ' + sh,
        }
      }
    })
    return keys
  },

  contextMenu: function (node, store) {
    if (!node) return
    var items = []
      , plugins = store.parent.allPlugins
    plugins.forEach((plugin) => {
      if (!plugin.types) return
      for (var name in plugin.types) {
        var type = plugin.types[name]
        var sh = type.shortcut || type
        items.push({
          title: (type.title || name),
          shortcut: 't ' + sh,
          icon: type.icon,
          action: 'type' + cap(name),
          disabled: name === node.type,
        })
      }
    })
    return {
      title: 'Set type',
      children: items,
    }
  },

  types: {
    base: {
      shortcut: 'n',
      title: 'Normal',
    }
  },

  store: {
    actions: function (plugins) {
      var actions = {
        changeType: function (id, type, update) {
          if (!id) {
            ids = this.view.mode === 'visual' ? this.view.selection : [this.view.active]
          } else {
            ids = [id]
          }
          var refocus
          if (this.view.mode === 'insert') {
            refocus = document.activeElement
            document.activeElement.blur()
          }
          update.type = type
          if (ids.length > 1) {
            this.updateMany(ids, ids.map(() => clone(update)))
          } else {
            this.update(ids[0], clone(update))
          }
          if (refocus) {
            refocus.focus()
            this.setMode('insert')
          }
        },
      }

      plugins.forEach((plugin) => {
        if (!plugin.types) return
        Object.keys(plugin.types).forEach(function (name) {
          var defn = plugin.types[name]
          actions['type' + cap(name)] = function (id) {
            var update = {}
            if (defn.update) {
              if ('function' === typeof defn.update) {
                update = defn.update()
              } else {
                update = defn.update
              }
            }
            this.changeType(id, name, update)
          }
        })
      })
      return actions
    },
  },
}


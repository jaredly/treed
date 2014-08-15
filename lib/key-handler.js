
module.exports = keyHandler

/**
 * Organize the keys definition, the actions definition, and the ctrlactions
 * all together in one lovely smorgasbord.
 *
 * keys: {action: key shortcut definition}
 * actions: {action: {action definition}}
 * ctrlactions: {name: function}
 */
function keyHandler(keys, actions, ctrlactions) {
  var bound = {}
  for (var action in keys) {
    if (!actions[action]) {
      throw new Error('invalid configuration: trying to bind unknown action. ' + action)
    }
    bound[keys[action]] = bindAction(action, actions[action], ctrlactions)
  }
  return bound
}

function bindAction(name, action, ctrlactions) {
  var pre = makePre(action.active)
  var type = typeof action.action
  var main
  switch (typeof action.action) {
    case 'string': main = ctrlactions[action.action]; break;
    case 'undefined': main = ctrlactions[camel(name)]; break;
    case 'function': main = action.action; break;
    default: throw new Error('unknown action ' + action.action)
  }

  if (!main) {
    throw new Error('Invalid action configuration ' + name)
  }

  if (!pre) {
    return main
  }

  return function () {
    if (!pre.call(this)) return
    return main.call(this, this.active)
  }
}

function makePre(active) {
  switch (active) {
    case true: return function(main) {
      return this.active
    }
    case '!new': return function (main) {
      return this.active && this.active !== 'new'
    }
    case '!root': return function (main) {
      return this.active && this.active !== this.root
    }
    default: return null
  }
}

function camel(string) {
  return string.replace(/ (\w)/, function (a, x) { return x.toUpperCase() })
}


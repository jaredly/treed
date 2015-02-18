
var keyHandler = require('./lib/keys')

module.exports = keyHandlers

function keyHandlers(keys, actions, plugins, allPlugins) {
  var modes = ['visual', 'normal', 'insert']

  var collected = {}
  modes.forEach((mode) => collected[mode] = {})

  var typed = {}
  modes.forEach((mode) => typed[mode] = {})

  var collect = function (keys) {
    if ('function' === typeof keys) {
      keys = keys(allPlugins)
    }
    for (var actionName in keys) {
      modes.forEach((mode) => {
        if (keys[actionName][mode]) {
          if (keys[actionName].type) {
            if (!typed[mode][keys[actionName][mode]]) {
              typed[mode][keys[actionName][mode]] = {}
            }
            typed[mode]
              [keys[actionName][mode]]
              [keys[actionName].type] = actionName
          } else {
            collected[mode][actionName] = keys[actionName][mode]
          }
        }
      })
    }
  }

  collect(keys)

  if (plugins) {
    plugins.forEach(collect)
  }

  return {
    visual: bindKeys(collected.visual, typed.visual, actions),
    normal: bindKeys(collected.normal, typed.normal, actions),
    insert: bindKeys(collected.insert, typed.insert, actions),
  }
}

function camel(actionName) {
  return actionName.replace(/ (\w)/g, (full, letter) => letter.toUpperCase())
}

function bindKeys(keys, typed, actions) {
  var binds = {}
  Object.keys(keys).forEach((actionName) => {
    var action = camel(actionName)
    if (!actions[action]) {
      console.warn('[binding keys] unknown action: ' + action)
      return;
    }
    binds[keys[actionName]] = function(){return actions[action]()}
  })

  Object.keys(typed).forEach(keyBinding => {
    var camels = {}
    for (var type in typed[keyBinding]) {
      camels[type] = camel(typed[keyBinding][type])
      if (!actions[camels[type]]) {
        console.warn('[binding keys] unknown action: ' + camels[type])
        delete camels[type]
      }
    }
    /*
    if (Object.keys(camels).length === 1) {
      binds[typed[name]] = function(){return actions[action]()}
    }
    */
    binds[keyBinding] = function(){
      var id = actions.view.active
      type = actions.db.nodes[id].type || 'base'
      if (!camels[type]) {
        return console.warn('Keybinding not defined for type: ' + type)
      }
      return actions[camels[type]](id)
    }
  })

  return keyHandler(binds)
}


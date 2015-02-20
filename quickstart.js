
var React = require('react')
  , Treed = require('./classy')
  , ListView = require('./views/list')
  , listKeys = require('./views/list/keys')
  , baseKeys = flattenKeySections(require('./stores/keys'))
  , extend = require('./util/extend')

module.exports = Treed

Treed.prototype.quickstart = function (el, options) {
  options = options || {}

  el = ensureElement(el)
  var allKeys = extend({}, baseKeys, flattenKeySections(options.keys || listKeys))

  this.keyManager.listen(window)

  return this.initStore(options.data || {content: ''}, {
    actions: options.actions || require('./views/list/actions'),
  }).then(() => {
    return new Promise((resolve, reject) => {
      var viewOptions = extend({
        keys: allKeys,
      }, options.viewOptions)
      var View = options.View || ListView
        , props = this.addView(viewOptions)

      React.render(<View {...props}/>, el, function (err) {
        if (err) return reject(err)
        resolve(props.store)
      })
    })
  }).catch(error => {
    console.warn('Treed initialization failed!', error)
    throw error
  });
}

function flattenKeySections(keys) {
  var ret = {}
  for (var name in keys) {
    for (var sub in keys[name]) {
      ret[sub] = keys[name][sub]
    }
  }
  return ret
}

function ensureElement(el) {
  if ('string' === typeof el) {
    var found = document.querySelector(el)
    if (!found) throw new Error('element not found: ' + el)
    el = found
  }
  return el
}


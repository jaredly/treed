
var React = require('react')

window.React = React

var ListView = require('../../views/list')
var keys = require('../../views/list/keys')
var keyHandlers = require('../../key-handlers')

var plugins = [
  require('../../plugins/collapse'),
  // require('../plugins/tags'),
  require('../../plugins/rebase'),
  require('../../plugins/done'),
]

function pluginType(plugins, type) {
  return plugins.reduce((list, plugin) => {
    return plugin[type] ? [plugin[type]].concat(list) : list
  }, [])
}

function perfInitial(store, max, done, times) {
  var start = Date.now()
  var node = document.getElementById('example')
  initialRender(store, function () {
    var time = (Date.now() - start)
    console.log(time + 'ms to render')
    if (times && times.length >= max) {
      var avg = times.reduce((a, b) => a + b)/times.length
      console.log(avg + 'ms average after ' + times.length + ' tries; ' + times)
      PERF.initial = [avg, times]
      return done(avg, times)
    }
    resetDom()
    perfInitial(store, max, done, [time].concat(times || []))
  })
}

function resetDom() {
  var node = document.getElementById('example')
  node.parentNode.removeChild(node)
  var div = document.createElement('div')
  div.id = 'example'
  document.body.appendChild(div)
}

function initialRender(store, done) {
  React.renderComponent(ListView({
    plugins: pluginType(plugins, 'view'),
    nodePlugins: pluginType(plugins, 'node'),
    keys: keyHandlers(keys, store.actions, pluginType(plugins, 'keys')),
    store: store,
  }), document.getElementById('example'), done)
}

function reactPerfInitial(store, done) {
  resetDom()
  React.addons.Perf.start()
  initialRender(store, function () {
    React.addons.Perf.stop()
    PERF.reactInitial = React.addons.Perf.getLastMeasurements()
    done()
  })
}

function perfRebase(store, done) {
  store.onDone(function () {
    done()
  })
  var node = store.getNode(store.root)
  store.actions.rebase(node.children[2])
}

function perfRebaseUp(store, done) {
  store.onDone(function () {
    done()
  })
  var node = store.getNode(store.root)
  store.actions.rebaseUp()
}

function rebaseDance(store, max, done, times) {
  if (times && times.length >= max) {
    PERF.rebases = times
    return done()
  }
  var start = Date.now()
  perfRebase(store, function () {
    var down = Date.now() - start
    start = Date.now()
    perfRebaseUp(store, function () {
      rebaseDance(store, max, done, [[down, Date.now() - start]].concat(times || []))
    })
  })
}

window.PERF = {}

/*
require('../').run({
  plugins: plugins,
}, function (store) {
  perfInitial(store, 10, function (avg, times) {
    reactPerfInitial(store, function () {
      rebaseDance(store, 10, function () {
        console.log('Alldone')
      })
      /*
      perfRebase(store, function () {
        perfRebaseUp(store, function () {
          console.log('Alldone')
        })
      })
    })
  })
})

      */



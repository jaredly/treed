
var nm = require('../../lib')

module.exports = {
  run: runDemo,
  preload: preload,
  skins: {
    wf: require('../../skins/workflowy'),
    wb: require('../../skins/whiteboard')
  },
  pl: {
    Mem: require('../../lib/pl/mem'),
    Firebase: require('../../lib/pl/firebase')
  }
}

function merge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
}

function preload(scripts, cb) {
  var waiting = 0
  scripts.forEach(function (name) {
    waiting += 1
    var node = document.createElement('script')
    node.src = name
    var done = false
    node.onload = node.onreadystatechange = function () {
      if (done || (this.readyState && this.readyState !== 'loaded' && this.readyState !== 'complete')) {
        return
      }
      done = true
      node.onload = node.onreadystatechange = null
      waiting -= 1
      if (!waiting) {
        cb()
      }
    }
    document.body.appendChild(node)
  })
}

function runDemo(options, done) {
  var o = merge({
    noTitle: false,
    title: 'Treed Example',
    el: 'example',
    Model: nm.Model,
    Controller: nm.Controller,
    View: nm.View,
    viewOptions: {
      ViewLayer: nm.ViewLayer,
      Node: nm.Node
    },
    style: [],
    data: demoData,
    ctrlOptions: {},
    initDB: function () {},
  }, options)

  if (!o.noTitle) {
    document.title = o.title
    document.getElementById('title').textContent = o.title
  }

  o.style.forEach(function (name) {
    var style = document.createElement('link');
    style.rel = 'stylesheet'
    style.href = name
    document.head.appendChild(style);
  });

  var db = o.pl || new module.exports.pl.Mem({});

  db.init(function (err) {
    if (err) {
      return loadFailed(err);
    }

    initDB(db, function (err, id, map, wasEmpty) {

      window.model = new o.Model(id, map, db)
      window.ctrl = window.controller = new o.Controller(model, o.ctrlOptions)
      window.view = window.view = ctrl.setView(
        o.View,
        o.viewOptions
      );
      if (wasEmpty) {
        for (var i=0;i<o.data.children.length; i++) {
          ctrl.importData(o.data.children[i], id);
        }
        options.initDB(window.model)
        window.view.rebase(id);
      }
      document.getElementById(o.el).appendChild(view.getNode());

      done && done(window.model, window.ctrl, window.view, db)

    });
  });
}

function initDB(db, done) {
  db.findAll('root', function (err, roots) {
    if (err) return done(err)

    if (!roots.length) {
      return loadDefault(db, done)
    }

    db.findAll('node', function (err, nodes) {
      if (err) return done(new Error('Failed to load items'))
      if (!nodes.length) return done(new Error("Data corrupted - could not find root node"))

      var map = {}
        , id = roots[0].id
      for (var i=0; i<nodes.length; i++) {
        map[nodes[i].id] = nodes[i]
      }
      done(null, id, map, false)
    })
  })
}

function loadDefault(db, done) {
  var ROOT_ID = 50

  // load default
  db.save('root', ROOT_ID, {id: ROOT_ID}, function () {
    var map = {}
    map[ROOT_ID] = {
      id: ROOT_ID,
      children: [],
      collapsed: false,
      content: "Home",
      meta: {},
      depth: 0
    }

    db.save('node', ROOT_ID, map[ROOT_ID], function () {
      done(null, ROOT_ID, map, true)
    })
  })
}



var nm = require('../../lib')
var MemPL = require('../../lib/pl/mem')
var wf = require('../../skins/workflowy')
var wb = require('../../skins/whiteboard')


module.exports = {
  run: runDemo,
  skins: {
    wf: wf,
    wb: wb
  },
  pl: {
    Mem: MemPL
  }
}

function merge(a, b) {
  for (var c in b) {
    a[c] = b[c]
  }
  return a
}

function runDemo(options) {
  var o = merge({
    title: 'Treed Example',
    el: 'example',
    Model: nm.Model,
    Controller: nm.Controller,
    View: nm.View,
    Pl: MemPL,
    viewOptions: {
      ViewLayer: nm.ViewLayer,
      Node: nm.Node
    },
    style: [],
    data: demoData
  }, options)

  document.title = o.title
  document.getElementById('title').textContent = o.title

  o.style.forEach(function (name) {
    var style = document.createElement('link');
    style.rel = 'stylesheet'
    style.href = name
    document.head.appendChild(style);
  });

  var db = new o.Pl({});

  db.init(function (err) {
    if (err) {
      return loadFailed(err);
    }

    initDB(db, function (err, id, map) {

      window.model = window.model = new o.Model(id, map, db)
      window.ctrl = window.controller = new o.Controller(model)
      window.view = window.view = ctrl.setView(
        o.View,
        o.viewOptions
      );
      ctrl.importData(o.data);
      var child = model.ids[id].children[0]
      window.view.rebase(child);
      document.getElementById(o.el).appendChild(view.getNode());

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
      done(null, id, map)
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
      done(null, ROOT_ID, map)
    })
  })
}


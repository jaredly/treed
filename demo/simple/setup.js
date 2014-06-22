
var db = new nm.pl.Mem({});

db.init(function (err) {
  if (err) {
    return loadFailed(err);
  }

  initDB(db, function (err, id, map) {

    window.model = window.model = new nm.Model(id, map, db)
    window.ctrl = window.controller = new nm.Controller(model)
    window.view = window.view = ctrl.setView(
      nm.View,
      {
        ViewLayer: nm.ViewLayer,
        Node: nm.Node
      }
    );
    ctrl.importData(demoData);
    document.getElementById('example').appendChild(view.getNode());

  });
});

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


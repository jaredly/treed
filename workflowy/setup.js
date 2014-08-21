
demo.run({
  title: 'Workflowy example',
  View: demo.skins.wf.View,
  Model: demo.skins.wf.Model,
  Controller: demo.skins.wf.Controller,

  viewOptions: {
    ViewLayer: demo.skins.wf.ViewLayer,
    Node: demo.skins.wf.Node
  },

  initDB: function (model) {
    var ids = model.ids
    var last = '50'
    var i = 0
    for (var id in ids) {
      if (i++ % 2) continue;
      ids[id].meta.tags = [last]
      if (!ids[last].meta.references) {
        ids[last].meta.references = []
      }
      ids[last].meta.references.push(id)
      last = id
    }
  },

  style: ['setup.css', 'build/workflowy.css']
});


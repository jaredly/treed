
demo.run({
  title: 'Workflowy example',
  View: demo.skins.wf.View,
  Model: demo.skins.wf.Model,
  Controller: demo.skins.wf.Controller,
  viewOptions: {
    ViewLayer: demo.skins.wf.ViewLayer,
    Node: demo.skins.wf.Node
  },
  style: ['build/workflowy.css']
});


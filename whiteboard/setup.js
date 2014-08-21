
demo.run({
  title: 'Whiteboard example',
  View: demo.skins.wb.View,
  Model: demo.skins.wf.Model,
  Controller: demo.skins.wf.Controller,
  viewOptions: {
    ViewLayer: demo.skins.wf.ViewLayer,
    Node: demo.skins.wf.Node
  },
  style: ['build/whiteboard.css', 'setup.css']
});


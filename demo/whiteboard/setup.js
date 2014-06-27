
runDemo({
  title: 'Whiteboard example',
  View: nm.skins.wb.View,
  Model: nm.skins.wf.Model,
  Controller: nm.skins.wf.Controller,
  viewOptions: {
    ViewLayer: nm.skins.wf.ViewLayer,
    Node: nm.skins.wf.Node
  },
  style: ['build/whiteboard.css', 'setup.css']
});



var treed = require('treed')
var TreeView = require('treed/views/tree')

var Rebase = require('treed/mixins/rebase')
var Tags = require('treed/mixins/tags')
var Done = require('treed/mixins/done')

var demo = require('./')

demo.run({
  mixins: [
    Rebase,
    Tags,
    Done
  ],
}, function (actions, temp, db) {
  React.renderComponent(TreeView({
    mixins: [Rebase, Tags, Done],
    actions: actions,
    temp: temp,
    db: db
  }), document.getElementById('example'))
})


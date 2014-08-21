
var treed = require('treed')
var TreeView = require('treed/views/tree')

var demo = require('./')

demo.run(function (disp, temp, db) {
    React.renderComponent(TreeView({
        disp: disp,
        temp: temp,
        db: db
    }), document.getElementById('example'))
})


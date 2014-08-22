
var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Listener = require('../listener')
var TreeItem = require('./tree-item')
var SimpleBody = require('./simple-body')

var TreeView = React.createClass({
  mixins: [
    Listener(function (store, props) {
      return {root: store.root}
    })
  ],

  propTypes: {
    mixins: PT.array,
    body: PT.object,
  },

  componentWillMount: function () {
    this.listen('root')
  },

  getDefaultProps: function () {
    return {
      body: SimpleBody
    }
  },

  render: function () {
    return TreeItem({
      store: this.props.store,
      mixins: this.props.mixins,
      body: this.props.body,
      id: this.state.root
    })
  },
})

module.exports = TreeView

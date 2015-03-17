
var React = require('react')
  , PT = React.PropTypes
  , ShowTags = require('./show-tags')

var Tagger = React.createClass({
  propTypes: {
    fetchTags: PT.func,
    onDone: PT.func,
    onCancel: PT.func,
  },
  render: function () {
    return <div className='tagger'>
      Tags
    </div>
  },
})

module.exports = Tagger



var React = require('react')
  , cx = require('classnames')
  , PT = React.PropTypes
  , classnames = require('classnames')
  , getSrc = require('./get-src')

var Uploader = React.createClass({
  propTypes: {
    onUpload: PT.func,
  },

  _onClick: function () {
    this.refs.file.value = '';
    this.refs.file.onchange = this._onChange;
    this.refs.file.click();
  },

  _onChange: function (e) {
    var files = e.target.files
    if (!files || !files.length) return
    getSrc(files[0], this.props.onUpload)
  },

  render: function () {
    return <div className='Uploader'>
      <h3 onClick={this._onClick}>Click to upload an image</h3>
      <input type="file" ref="file" style={{display: 'none'}} />
    </div>
  },
})

module.exports = Uploader

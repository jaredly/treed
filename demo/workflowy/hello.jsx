/** @jsx React.DOM */

var BackPicker = require('./backend-picker.jsx')

var Hello = module.exports = React.createClass({
  displayName: 'Hello',
  render: function () {
    return (
      <div className='hello'>
        <h1>Notablemind</h1>
        <BackPicker onReady={this.props.onReady} backs={this.props.backs}/>
        <ul>
          <li>You own your data</li>
          <li>Free and open source</li>
          <li>Keyboard optimized</li>
        </ul>
        <h3>Roadmap</h3>
        <ul>
          <li>google drive sync</li>
          <li>custom server for collaboration</li>
          <li>whiteboard</li>
        </ul>
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


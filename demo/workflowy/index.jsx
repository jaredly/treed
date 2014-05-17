/** @jsx React.DOM */

var HelloPage = require('./hello.jsx')
  , MainApp = require('./main')
  , Header = require('./header.jsx')

var NotableMind = module.exports = React.createClass({
  displayName: 'NotableMind',
  getDefaultProps: function () {
    return {
      backs: {}
    }
  },
  getInitialState: function () {
    return {
      back: null,
      backType: null
    }
  },
  onChangeBack: function (back, backType) {
    this.setState({back: back, backType: backType})
  },
  render: function () {
    if (!this.state.back) {
      return (
        <div className='notablemind'>
          <HelloPage onReady={this.onReady} backs={this.props.backs}/>
        </div>
      )
    }
    return (
      <div className='notablemind'>
        <Header back={this.state.back}
          backType={this.state.backType}
          backs={this.props.backs}
          onChangeBack={this.onChangeBack}/>
        <MainApp db={this.state.back}/>
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


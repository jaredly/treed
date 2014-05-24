/** @jsx React.DOM */

var BackDrop = require('./back-drop.jsx')
  , BackPick = require('./back-pick.jsx')

var BackPicker = module.exports = React.createClass({
  displayName: 'BackPicker',
  getDefaultProps: function () {
    return {
      // should override
      onReady: function (back, type) {
        console.log('ready with back', back, type)
      },
      backs: {
      },
      currentBack: null,
      dropdown: false,
      // don't have to override
      setType: function (type) {
        localStorage._notablemind_backend = type
      },
      getType: function () {
        return localStorage._notablemind_backend || null
      }
    }
  },
  getInitialState: function () {
    return {
      loading: false,
      error: null
    }
  },
  componentDidMount: function () {
    if (this.props.currentBack) return
    var type = this.props.getType()
    if (!type) return
    this.initBack(type)
  },
  setBackType: function (type) {
    this.props.setType(type)
    this.initBack(type)
  },
  initBack: function (type) {
    var opt = this.props.backs[type]
    if (!opt) {
      return this.setState({type: null, error: 'Invalid storage type: ' + type})
    }
    this.setState({loading: type, error: null})
    var back = new opt.cls(opt.options || {})
    back.init(function (err) {
      if (err) {
        return this.setState({
          error: 'Failed to connect to storage: ' + err.message,
          loading: false,
          type: null
        })
      }
      this.setState({loading: false})
      this.props.onReady(back, type)
    }.bind(this))
  },
  onShow: function () {
    this.setState({showing: true})
  },
  onHide: function (e) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({showing: false})
  },
  componentDidUpdate: function () {
    if (!this.props.dropdown) return
    if (this.state.showing) {
      window.addEventListener('mousedown', this.onHide)
    } else {
      window.addEventListener('mousedown', this.onHide)
    }
  },
  render: function () {
    var cls = this.props.dropdown ? BackDrop : BackPick
    return cls({
      onSelect: this.setBackType,
      backs: this.props.backs,
      loading: this.state.loading,
      currentType: this.props.getType()
    })
  }
})


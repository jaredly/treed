var React = require('react/addons')
  // , PT = React.PropTypes

function line(obj) {
  var {x1, y1, x2, y2} = obj
  return 'M' + parseInt(x1) + ' ' + parseInt(y1) + ' L' + parseInt(x2) + ' ' + parseInt(y2)
}

var MindmapLinks = React.createClass({
  componentDidMount() {
    // this.renderCanvas()
  },
  componentDidUpdate() {
    // this.renderCanvas()
  },
  renderCanvas() {
    var ctx = this.getDOMNode().getContext('2d')
    ctx.clearRect(0, 0, this.props.width, this.props.height)
    ctx.strokeStyle='red'
    ctx.lineWidth = 10
    var dx = this.props.left
      , dy = this.props.top
    this.props.links.forEach(link => {
      ctx.beginPath()
      ctx.moveTo(link.y1 + dx, link.x1 + dy)
      ctx.lineTo(link.y2 + dx, link.x2 + dy)
      ctx.stroke()
    })
  },

  componentWillReceiveProps: function () {
  },

  renderSVG() {
    return <svg className='MindmapLinks'>
      {this.props.links.map(link =>
        <Link
          key={link.id}
          line={link}/>
      )}
    </svg>
  },

  render() {
    return this.renderSVG()
    // return <canvas width={this.props.width} height={this.props.height}/>
  }
})


var Link = React.createClass({
  getDefaultProps: function () {
    return {
      dur: 200,
    }
  },
  getInitialState: function () {
    return {t: 0, start: Date.now(), line: this.props.line}
  },
  componentWillMount: function () {
    this._int = setInterval(this.up, 10)
  },
  componentWillReceiveProps(nextProps) {
    if (line(this.props.line) !== line(nextProps.line)) {
      this.setState({
        t: 0,
        start: Date.now(),
        line: this.props.line
      })
    }
  },
  componentDidUpdate: function () {
    if (this.state.t === 0 && !this._int) {
      this._int = setInterval(this.up, 10)
    }
  },
  componentWillUnmount: function () {
    clearInterval(this._int)
    delete this._int
  },
  up: function () {
    if (this.state.t >= this.props.dur) {
      clearInterval(this._int)
      delete this._int
      return
    }
    this.setState({t: Date.now() - this.state.start})
  },
  getLine: function () {
    var ease = d3.ease('ease')
    var t = ease(this.state.t / this.props.dur)
    var {x1, x2, y1, y2} = this.state.line // current
      , next = this.props.line
      , part = (a, b) => a + t*(b-a)
    return `M${part(x1, next.x1)} ${part(y1, next.y1)} L${part(x2, next.x2)} ${part(y2, next.y2)}`;
  },
  render: function () {
    return <path d={this.getLine()}/>
  },
})

module.exports = MindmapLinks

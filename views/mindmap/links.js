var React = require('react/addons')
  , cx = React.addons.classSet
  , PT = React.PropTypes

function line(x1, y1, x2, y2) {
  return 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2
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
        <Link x1={link.x1}
          key={link.id}
          y1={link.y1}
          x2={link.x2}
          y2={link.y2}/>
      )}
    </svg>
  },

  render() {
    return this.renderSVG()
    // return <canvas width={this.props.width} height={this.props.height}/>
  }
})

var Link = React.createClass({
  getInitialState: function () {
    return this.props
  },
  componentWillReceiveProps(nextProps) {
    this.setState(nextProps)
  },
  render: function () {
    return <path d={line(this.state.x1, this.state.y1, this.state.x2, this.state.y2)}/>
  },
})

module.exports = MindmapLinks

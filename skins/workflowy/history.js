
/** jshint: marked: false */
var d = React.DOM

var History = module.exports = React.createClass({
  displayName: 'History',
  getDefaultProps: function () {
    return {
      items: [],
      onClick: function () {}
    }
  },
  mouseDown: function (id, e) {
    if (e.button !== 0) return
    this.props.onClick(id)
  },
  render: function () {
    var that = this
    return d.ul(
      {className: 'breadcrumb'},
      this.props.items.slice(0, -1).map(function (item, i) {
        return d.li({
          key: item.id,
          className: 'treed__bread',
          onMouseDown: that.mouseDown.bind(null, item.id),
          dangerouslySetInnerHTML: {
            __html: marked(item.content)
          }
        })
      })
    )
  }
})


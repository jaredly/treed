

var d = React.DOM

var MainApp = React.createClass({
  getInitialState: function () {
    return {
      lineage: [],
    }
  },
  changeBread: function (id) {
    this.refs.wf.wf.actions.clickBullet(id)
  },
  updateBread: function (lineage) {
    this.setState({lineage: lineage})
  },
  render: function () {
    return d.div({
      className: 'workflowme'
    }, History({items: this.state.lineage, onClick: this.changeBread}),
       Workflowy({
         ref: 'wf',
         id: this.props.id,
         tree: this.props.tree,
         onBreadCrumb: this.updateBread
      })
    )
  }
})

var Workflowy = React.createClass({
  componentDidMount: function () {
    this.wf = new WFController(this.props.id, this.props.tree, {onBullet: this.props.onBreadCrumb})
    this.getDOMNode().appendChild(this.wf.node)
  },
  render: function () {
    return d.div()
  }
})

var History = React.createClass({
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
          className: 'listless__bread',
          onMouseDown: that.mouseDown.bind(null, item.id),
          dangerouslySetInnerHTML: {
            __html: marked(item.name)
          }
        })
      })
    )
  }
})

var base = document.getElementById('example')
  , data = make_listed(flare_data, undefined, true)

React.renderComponent(MainApp({
  id: data.id,
  tree: data.tree
}), base)


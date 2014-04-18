

var d = React.DOM
  , lib = require('./index')
  , util = require('./lib/util')
  , MemPL = require('./lib/mem-pl')
  , PL = require('./lib/local-pl')

var MainApp = React.createClass({
  getDefaultProps: function () {
    return {
      db: null
    }
  },
  getInitialState: function () {
    return {
      lineage: [],
      model: null,
      loading: true
    }
  },
  changeBread: function (id) {
    this.refs.wf.wf.actions.clickBullet(id)
  },
  updateBread: function (lineage) {
    this.setState({lineage: lineage})
  },
  componentDidMount: function () {
    var db = this.props.db
      , that = this
    db.findAll('root', function (roots) {
      if (!roots.length) {
        // load default
        db.save('root', {id: 0})
        var tree = {
          0: {
            id: 0,
            children: [],
            collapsed: false,
            data: {name: 'Home'},
            depth: 0
          }
        }
        db.save('node', tree[0])
        var model = new lib.Model(0, tree, db)
        return that.setState({loading: false, model: model})
      }
      db.findAll('node', function (nodes) {
        var tree = {}
          , id = roots[0].id
        for (var i=0; i<nodes.length; i++) {
          tree[nodes[i].id] = nodes[i]
        }
        var model = new lib.Model(id, tree, db)
        return that.setState({loading: false, model: model})
      })
    })
  },
  render: function () {
    if (this.state.loading) {
      return d.div({className: 'workflowme'}, 'Loading...')
    }
    return d.div({
      className: 'workflowme'
    }, History({items: this.state.lineage, onClick: this.changeBread}),
       Workflowy({
         ref: 'wf',
         model: this.state.model,
         onBreadCrumb: this.updateBread
      })
    )
  }
})

var Workflowy = React.createClass({
  componentDidMount: function () {
    this.wf = new lib.Controller(this.props.model, {onBullet: this.props.onBreadCrumb})
    this.wf.on('rebase', function (root) {
      this.props.onBreadCrumb(this.props.model.getLineage(root))
    }.bind(this))
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
  // , data = util.make_listed(flare_data, undefined, true)

React.renderComponent(MainApp({
  db: new PL(),
  // id: data.id,
  // tree: data.tree
}), base)


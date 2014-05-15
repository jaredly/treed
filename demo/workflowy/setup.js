

var d = React.DOM
  , lib = require('./index')
  , util = require('./lib/util')
  , MemPL = require('./lib/mem-pl')

var PLs = {
  'Local': require('./lib/local-pl'),
  'Rest': require('./lib/rest-pl'),
  'Mem': require('./lib/mem-pl'),
  'Dumb': require('./lib/dumb-pl')
}

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
    db.findAll('root', function (err, roots) {
      if (err || !roots.length) {
        // load default
        db.save('root', 50, {id: 50})
        var tree = {
          50: {
            id: 50,
            children: [],
            collapsed: false,
            data: {name: 'Home'},
            depth: 0
          }
        }
        db.save('node', 50, tree[50], function () {
          var model = window.model = new lib.Model(50, tree, db)
          that.setState({loading: false, model: model})
        })
        return
      }
      db.findAll('node', function (err, nodes) {
        if (err) return that.setState({error: 'Failed to load items'})
        var tree = {}
          , id = roots[0].id
        for (var i=0; i<nodes.length; i++) {
          tree[nodes[i].id] = nodes[i]
        }
        var model = window.model = new lib.Model(id, tree, db)
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

if ('string' === typeof window.PL) {
  window.PL = new PLs[window.PL]()
}

var base = document.getElementById('example')

React.renderComponent(MainApp({
  db: window.PL,
  // id: data.id,
  // tree: data.tree
}), base)



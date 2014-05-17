
var History = require('./wf-history')
  , Model = require('./wf-model')
  , d = React.DOM

  , Workflowy = require('./wf-wrap')

// manage lineage, create and initialize model instance. It owns the state for
// the model.
var MainApp = module.exports = React.createClass({
  displayName: 'MainPage',
  getDefaultProps: function () {
    return {
      db: null // lib/pl-*
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
  loadModel: function (db) {
    var that = this
    db.findAll('root', function (err, roots) {
      if (err || !roots.length) {
        if (err) {
          this.setState({networkError: 'Failed to connect to server. Changes will not be synced'})
        }
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
          var model = window.model = new Model(50, tree, db)
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
        var model = window.model = new Model(id, tree, db)
        return that.setState({loading: false, model: model})
      })
    })
  },
  componentDidMount: function () {
    this.loadModel(this.props.db)
  },
  componentWillReceiveProps: function (props) {
    if (props.db !== this.props.db) {
      this.loadModel(props.db)
    }
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




module.exports = {
  id: 'movement',
  store: {
    init: function (store) {
      store.moving = null
    },

    actions: {
      startMoving: function (id) {
        if (id === this.root) return // TODO error?
        this.moving = id
        this.changed('moving')
      },

      doneMoving: function (pid, index) {
        if (!this.moving) return // TODO error?
        var opid = this.nodes[this.moving].parent
        this.executeCommand('move', {
          id: this.moving,
          npid: pid,
          nindex: index
        })
        this.changed('node:' + opid, 'node:' + pid) // do I need to add the moved node? probably not
      },
    }
  },

  // this should probably go in a separate file, b/c this is just for the tree
  // view
  view: {

    listener: {
      changes: ['moving'],

      updateStoreState: function (store, props) {
        var data = {moving: store.moving}

        if (data.moving && !this.state.moving) {
          var moveTargets = calcMoveTargets(this)
          this._moveListener = hitTargets.bind(this, moveTargets)
          window.addEventListener('mousemove', this._moveListener)
        } else if (!data.moving && this.state.moving) {
          data.movingTarget = null
          window.removeEventListener('mousemove', this._moveListener)
          delete this._moveListener
        }

        return data
      },
    },

    blocks: {
      bottom: function (node, actions, state) {
        if (!state.movingTarget) return
        return <div style={state.movingTarget.show}
                    className="m_Movement_target"/>
      },
    },

  },
}

function hitTargets(targets, e) {
  var hit = null
  for (var i=0; i<targets.length; i++) {
    if (hits(targets[i], e)) {
      hit = targets[i]
      break;
    }
  }
  this.setState({movingTarget: hit})
}


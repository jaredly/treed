/** @jsx React.DOM */

module.exports = {

  listener: {
    changes: ['moving'],

    updateStoreState: function (store, props) {
      var data = {moving: store.moving}

      if (data.moving && !this.state.moving) {
        var moveTargets = calcMoveTargets(this)
        this._moveListener = checkTargets.bind(this, moveTargets)
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
}

function checkTargets(targets, e) {
  var hit = null
  for (var i=0; i<targets.length; i++) {
    if (hits(targets[i], e)) {
      hit = targets[i]
      break;
    }
  }
  this.setState({movingTarget: hit})
}

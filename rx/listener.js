
var React = require('react/addons')
var PT = React.PropTypes

module.exports = function (options) {
  if ('function' === typeof options) {
    options = {
      initStoreState: options,
      updateStoreState: options
    }
  }

  var mixinUpdates = []

  return {
    propTypes: {
      store: PT.object.isRequired,
    },

    getInitialState: function () {
      return options.initStoreState.call(this, this.props.store, this.props)
    },

    listen: function () {
      var changes = [].slice.call(arguments)

      mixinUpdates = []
      this.props.mixins.forEach(function (mixin) {
        if (!mixin.listener) return
        if (mixin.listener.updateStoreState) {
          mixinUpdates.push(mixin.listener.updateStoreState)
        }
        if (mixin.listener.changes) {
          changes = changes.concat(mixin.listener.changes)
        }
      })

      this.props.store.on(changes, this._gotChanges)
      // save it for later so we can remove the listener on unmount
      if (!this._flux) this._flux = []
      this._flux.push([changes, this._gotChanges])
    },

    _gotChanges: function () {
      var state = options.updateStoreState.call(this, this.props.store, this.props)
      var extra
      for (var i=0; i<mixinUpdates.length; i++) {
        extra = mixinUpdates.call(this, state)
        for (var name in extra) state[name] = extra[name]
      }
      this.setState(state)
    },

    componentWillReceiveProps: options.shouldGetNew && function (nextProps) {
      if (options.shouldGetNew.call(this, nextProps)) {
        this.setState(options.initStoreState.call(this, this.props.store, this.props))
      }
    },

    componentWillUnmount: function () {
      if (!this._flux) return
      for (var i=0; i<this._flux.length; i++) {
        this.props.store.off(this._flux[i][0], this._flux[i][1])
      }
    },
  }
}


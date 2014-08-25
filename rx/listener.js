
var React = require('react/addons')
var PT = React.PropTypes

module.exports = function (options) {
  if ('function' === typeof options) {
    options = {
      initStoreState: options,
      updateStoreState: options
    }
  }

  var pluginUpdates = []

  var plugin = {
    propTypes: {
      store: PT.object.isRequired,
    },

    getInitialState: function () {
      return options.initStoreState.call(this, this.props.store, this.props)
    },

    listen: function () {
      var changes = [].slice.call(arguments)

      pluginUpdates = []
      if (this.props.plugins) {
        this.props.plugins.forEach((plugin) => {
          if (!plugin.listener) return
          if (plugin.listener.updateStoreState) {
            pluginUpdates.push(plugin.listener.updateStoreState)
          }
          if (plugin.listener.changes) {
            changes = changes.concat(plugin.listener.changes)
          }
        })
      }

      this.props.store.on(changes, this._gotChanges)
      // save it for later so we can remove the listener on unmount
      if (!this._flux) this._flux = []
      this._flux.push([changes, this._gotChanges])
    },

    _gotChanges: function () {
      var state = options.updateStoreState.call(this, this.props.store, this.props)
      var extra
      for (var i=0; i<pluginUpdates.length; i++) {
        extra = pluginUpdates.call(this, state)
        for (var name in extra) state[name] = extra[name]
      }
      this.setState(state)
    },

    componentWillReceiveProps: options.shouldGetNew && function (nextProps) {
      if (options.shouldGetNew.call(this, nextProps)) {
        if (options.getListeners) {
          this._stopListening()
          this.listen(options.getListeners(nextProps))
        }
        this.setState(options.initStoreState.call(this, nextProps.store, nextProps))
      }
    },

    _stopListening: function () {
      for (var i=0; i<this._flux.length; i++) {
        this.props.store.off(this._flux[i][0], this._flux[i][1])
      }
      this._flux = null
    },

    componentWillUnmount: function () {
      if (!this._flux) return
      this._stopListening()
    },
  }
  if (options.getListeners) {
    plugin.componentWillMount = function () {
      this.listen(options.getListeners(this.props))
    }
  }
  return plugin
}



var Promise = require('bluebird')
var React = require('react/addons')
var PT = React.PropTypes

module.exports = function (options) {
  if ('function' === typeof options) {
    options = {
      storeAttrs: options,
    }
  }

  var pluginUpdates = []

  var plugin = {
    propTypes: {
      store: PT.object.isRequired,
    },

    getInitialState: function () {
      var state = options.storeAttrs.call(this, this.props.store.getters, this.props)
      var extra
      if (options.initStoreState) {
        extra = options.initStoreState.call(this, state, this.props.store.getters, this.props)
        for (var name in extra) state[name] = extra[name]
      }
      return state
    },

    listen: function () {
      var changes = [].slice.call(arguments)
      if (arguments.length === 1 && Array.isArray(arguments[0])) {
          changes = arguments[0]
      }

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
      // if DEBUG
      var state = options.storeAttrs.call(this, this.props.store.getters, this.props)
      var extra, name
      if (options.updateStoreState) {
        extra = options.updateStoreState.call(this, state, this.props.store.getters, this.props)
        for (name in extra) state[name] = extra[name]
      }
      for (var i=0; i<pluginUpdates.length; i++) {
        extra = pluginUpdates.call(this, state)
        for (name in extra) state[name] = extra[name]
      }
      if (window.DEBUG_CHANGES) {
        console.log('got changes', state)
      }
      var p = Promise.pending()
      this.setState(state, function () {
        p.resolve()
      })
      return p
    },

    componentWillReceiveProps: options.shouldGetNew && function (nextProps) {
      if (options.shouldGetNew.call(this, nextProps)) {
        if (options.getListeners) {
          this._stopListening()
          this.listen(options.getListeners(nextProps, nextProps.store.events))
        }
        var state = options.storeAttrs.call(this, nextProps.store.getters, nextProps)
        var extra
        if (options.initStoreState) {
          extra = options.initStoreState.call(this, state, nextProps.store.getters, nextProps)
          for (var name in extra) state[name] = extra[name]
        }
        this.setState(state)
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
      this.listen(options.getListeners(this.props, this.props.store.events))
    }
  }
  return plugin
}



var React = require('react/addons')
var PT = React.PropTypes

module.exports = function (getState) {
  return {
    propTypes: {
      store: PT.object.isRequired,
    },

    getInitialState: function () {
      return getState(this.props.store, this.props)
    },

    listen: function () {
      var changes = [].slice.call(arguments)
      this.props.store.on(changes, this._gotChanges)

      // save it for later
      if (!this._flux) this._flux = []
      this._flux.push([changes, this._gotChanges])
    },

    _gotChanges: function () {
      this.setState(getState(this.props.store, this.props))
    },

    componentWillUnmount: function () {
      if (!this._flux) return
      for (var i=0; i<this._flux.length; i++) {
        this.props.store.off(this._flux[i][0], this._flux[i][1])
      }
    },
  }
}


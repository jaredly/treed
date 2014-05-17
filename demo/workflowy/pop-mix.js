
module.exports = {
  getInitialState: function () {
    return {
      showing: false
    }
  },
  componentDidUpdate: function (props, state) {
    if (this.state.showing === state.showing) return
    if (this.state.showing) {
      window.addEventListener('mousedown', this.onHide)
    } else {
      window.removeEventListener('mousedown', this.onHide)
    }
  },
  onShow: function () {
    this.setState({showing: true})
  },
  onHide: function (e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    this.setState({showing: false})
  }
}


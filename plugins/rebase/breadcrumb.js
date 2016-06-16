
var React = require('react')
var cx = require('classnames')
var PT = React.PropTypes

var Breadcrumb = React.createClass({
  propTypes: {
    rebase: PT.func,
    reload: PT.func,
  },

  getInitialState: function () {
    return {
      pedigree: this.props.reload()
    }
  },

  componentDidMount: function () {
    this.props.store.on([this.props.store.events.rootChanged()], this._reload)
  },

  componentWillUnmount: function () {
    this.props.store.off([this.props.store.events.rootChanged()], this._reload)
  },

  _reload: function () {
    this.setState({pedigree: this.props.reload()})
  },

  render: function () {
    return <ul className='Breadcrumb'>
      {this.state.pedigree.map(item =>
        <li key={item.id} onClick={this.props.rebase.bind(null, item.id)} className="Breadcrumb_item">
          {item.content.slice(0, 25)}
        </li>
      )}
    </ul>
  }
})

module.exports = Breadcrumb



var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var Breadcrumb = React.createClass({
  propTypes: {
    pedigree: PT.array,
    rebase: PT.func,
  },

  render: function () {
    return <ul className='Breadcrumb'>
      {this.props.pedigree.map(item =>
        <li onClick={this.props.rebase.bind(null, item.id)} className="Breadcrumb_item">
          {item.content.slice(0, 25)}
        </li>
      )}
    </ul>
  }
})

module.exports = Breadcrumb


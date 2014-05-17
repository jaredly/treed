/** @jsx React.DOM */

var d = React.DOM
  , BackendDropdown = require('./backend-dropdown.jsx')

var Header = module.exports = React.createClass({
  displayName: 'Header',
  getDefaultProps: function () {
    return {
      links: [
        {
          icon: 'help',
          title: 'Problem?',
          url: 'https://nm-errors.herokuapp.com/new'
        }, {
          icon: 'github',
          title: 'Contribute', 
          url: 'https://notablemind.github.io'
        }, {
          icon: 'about',
          title: 'About',
          url: 'https://notablemind.com'
        }
      ],
      back: null,
      backType: null,
      onChangeBack: function (back, type) {
        console.log('want to change to type:', back, type)
      }
    }
  },
  render: function () {
    return (
      <div className='header'>
        <h1 className='header-title'>Notablemind</h1>
        <ul className='header-links'>
          {
            this.props.links.map(function (link) {
              return (
                <li>
                  <a href={link.url} target='_blank' title={link.title}>
                    {link.icon && d.i({className: 'fa fa-' + link.icon})}
                    {link.title}
                  </a>
                </li>
              )
            })
          }
        </ul>
        <BackendDropdown current={this.props.backType}
          backs={this.props.backs}
          onChange={this.props.onChangeBackType}/>
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


/** @jsx React.DOM */

var d = React.DOM
  , BackendPicker = require('./backend-picker.jsx')

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
        <h1 className='header_title'>Notablemind</h1>
        <ul className='header_links'>
          {
            this.props.links.map(function (link, i) {
              return (
                <li key={i}>
                  <a className='header_link' href={link.url} target='_blank' title={link.title}>
                    {link.icon && d.i({className: 'fa fa-' + link.icon})}
                    {link.title}
                  </a>
                </li>
              )
            })
          }
        </ul>
        <div className='header_spacer'/>
        <BackendPicker currentBack={this.props.back}
          dropdown={true}
          backs={this.props.backs}
          onChange={this.props.onChangeBack}/>
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


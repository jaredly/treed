/** @jsx React.DOM */

var BackPick = module.exports = React.createClass({
  displayName: 'BackPick',
  render: function () {
    if (this.props.loading) {
      return (
        <div className='back-pick back-pick--loading'>
          <div className='back-pick_loading'>
            Connecting to {this.props.loading}...
          </div>
        </div>
      )
    }
    var backs = Object.keys(this.props.backs)
    return (
      <div className='back-pick'>
        {
          backs.map(function (type) {
            var back = this.props.backs[type]
            return (
              <div className='back-pick_choice'
                  key={type}
                  title={back.description}
                  onClick={this.props.onSelect.bind(null, type)}>
                <div className='back-pick_button'>
                  <i className={'fa fa-' + back.icon}/>
                  <span className='back-pick_title'>
                    {back.title}
                  </span>
                </div>
                <p className='back-pick_description'>
                  {back.description}
                </p>
              </div>
            )
          }.bind(this))
        }
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


/** @jsx React.DOM */

var BackDrop = module.exports = React.createClass({
  displayName: 'BackDrop',
  mixins: [require('./pop-mix')],
  getDefaultProps: function () {
    return {
      backs: {},
      loading: false,
      currentType: '',
      onSelect: function (type) {
        console.log('selecting type', type)
      }
    }
  },
  cancelDown: function (e) {
    e.stopPropagation()
  },
  onSelect: function (type) {
    this.onHide()
    this.props.onSelect(type)
  },
  render: function () {
    if (this.props.loading) {
      return (
        <div className='back-drop back-drop--loading'>
          <div className='back-drop_loading'>
            Connecting to {this.props.loading}...
          </div>
        </div>
      )
    }
    var cls = 'back-drop'
    if (this.state.showing) {
      cls += ' back-drop--showing'
    }
    var backs = Object.keys(this.props.backs)
      , cur = this.props.backs[this.props.currentType] || {}
    return (
      <div className={cls} onMouseDown={this.cancelDown}>
        <div className='back-drop_current' onClick={this.onShow}>
          <i className={'fa fa-' + cur.icon}/>
          <span className='back-drop_title'>
            {cur.shortname}
          </span>
        </div>
        <ul className='back-drop_list'>
          {
            backs.map(function (type) {
              if (type === this.props.currentType) return
              var back = this.props.backs[type]
              return (
                <li className='back-drop_choice'
                    key={type}
                    title={back.description}
                    onClick={this.onSelect.bind(null, type)}>
                  <i className={'fa fa-' + back.icon}/>
                  <span className='back-drop_title'>
                    {back.shortname}
                  </span>
                </li>
              )
            }.bind(this))
          }
        </ul>
      </div>
    )
  }
})

// vim: set tabstop=2 shiftwidth=2 expandtab:


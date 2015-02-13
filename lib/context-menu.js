
var React = require('react/addons')
  , cx = React.addons.classSet
  , PT = React.PropTypes

var ContextMenu = React.createClass({
  propTypes: {
    onClose: PT.func.isRequired,
    onSelect: PT.func,
    config: PT.object,
  },

  _onMouseDown: function (e) {
    e.stopPropagation();
  },

  _onSelect: function (item) {
    if (this.props.onSelect) this.props.onSelect(item)
    this.props.onClose()
  },

  render: function () {
    return <div
        style={{
          top: this.props.y,
          left: this.props.x,
          zIndex: 1000,
        }}
        onMouseDown={this._onMouseDown}
        className='ContextMenu'>
      <MenuBody
        onSelect={this._onSelect}
        onClose={this.props.onClose}
        items={this.props.config}
        zIndex={1000}/>
    </div>
  },
})

var MenuItem = React.createClass({
  propTypes: {
    config: PT.object,
    selected: PT.bool,
    onSelect: PT.func,
    onHover: PT.func,
    onClose: PT.func,
    zIndex: PT.number,
  },

  _onClick: function () {
    if (this.props.config.disabled) return
    if (this.props.config.action) {
      this.props.config.action()
      return this.props.onClose()
    }
    this.props.onSelect(this.props.config)
  },

  render: function () {
    return <div className={cx({
      'ContextMenu_item': true,
      'ContextMenu_item-selected': this.props.selected,
      'ContextMenu_item-disabled': this.props.config.disabled,
      'ContextMenu_item-parent': this.props.config.children && this.props.config.children.length,
    })}>
      <div className='ContextMenu_item_title'
           onMouseOver={this.props.onHover}
           onClick={this._onClick}>
        {/* this.props.config.icon &&
         <img src={this.props.config.icon}/> */}
        {this.props.config.title}
        {this.props.config.shortcut &&
          <span className='ContextMenu_item_shortcut'>
            {this.props.config.shortcut}
          </span>}
      </div>
      {this.props.selected &&
        this.props.config.children &&
        <MenuBody
          onClose={this.props.onClose}
          onSelect={this.props.onSelect}

          zIndex={this.props.zIndex + 1}
          items={this.props.config.children}/>}
    </div>
  }
})

var MenuBody = React.createClass({
  propTypes: {
    items: PT.array,
    zIndex: PT.number,

    onClose: PT.func,
    onSelect: PT.func,
  },

  getInitialState: function () {
    return {
      selected: null
    }
  },

  _onHover: function (i) {
    this.setState({selected: i})
  },

  render: function () {
    return <ul className='ContextMenu_body' style={{zIndex: this.props.zIndex}}>
      {this.props.items.map((item, i) =>
        <MenuItem
          config={item}
          zIndex={this.props.zIndex}
          onClose={this.props.onClose}
          onSelect={this.props.onSelect}
          onHover={this._onHover.bind(null, i)}
          selected={this.state.selected === i}/>)}
    </ul>
  },
})

ContextMenu.show = function (definition, x, y, onSelect) {
  var node = document.createElement('div')
  document.body.appendChild(node)
  var closeOut = function (e) {
    window.removeEventListener('mousedown', closeOut)
    if (!node.parentNode) return
    document.body.removeChild(node)
  }
  window.addEventListener('mousedown', closeOut)

  React.render(<ContextMenu
    x={x} y={y}
    config={definition}
    onSelect={onSelect}
    onClose={closeOut}/>, node)
}

module.exports = ContextMenu


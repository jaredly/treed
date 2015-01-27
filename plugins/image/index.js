
var React = require('react/addons')
  , cx = React.addons.classSet
  , DefaultEditor = require('../../views/body/default-editor')

var ImageBase = React.createClass({
  render: function () {
  }
})

var Imager = React.createClass({
  render: function () {
    var img = this.props.src ?
          <img src={this.props.src} title={this.props.title}/> :
          <h1 onClick={this.props.onUpload}>Click to upload an image</h1>
    if (this.props.title && this.props.title.trim()) {
      return <div>
        <div className='treed_body_rendered' onClick={this.props.onClick}>{this.props.title}</div>
        {img}
      </div>
    }
    return img
  },
})

var ImageEditor = React.createClass({

  focus: function () {
    return this.refs.text.focus.apply(null, arguments)
  },
  isFocused: function () {
    return this.refs.text.isFocused.apply(null, arguments)
  },

  _onPaste: function (e) {
    var blob = e.clipboardData.items[0].getAsFile()
      , reader = new FileReader()
    if (!blob) return
    e.preventDefault()
    reader.onload = e => this.props.editProps.store.actions.set(this.props.editProps.node.id, 'imageSrc', e.target.result)
    reader.readAsDataURL(blob)
  },

  render: function () {

    var props = this.props.editProps
    props.onPaste = this._onPaste

    return <div>
    {React.createElement(DefaultEditor, props)}
      {this.props.src ?
          <img src={this.props.src} title={this.props.title}/> :
          <h1 onClick={this.props.onUpload}>Click to upload an image</h1>}
    </div>
  },
})

module.exports = {
  types: {
    image: {
      shortcut: 'i',
    }
  },

  node: {
    bodies: {
      image: {
        renderer: function () {
          var click = () => {
            if (this.props.editState) return
            this.props.actions.edit(this.props.node.id)
          }
          return <Imager onClick={click} src={this.props.node.imageSrc} title={this.props.node.content}/>
        },

        editor: function (props) {
          return <ImageEditor editProps={props} ref={props.ref} src={props.node.imageSrc} title={props.node.content}/>
        },
      }
    }
  }
}


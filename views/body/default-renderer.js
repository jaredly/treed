
var React = require('react/addons')
var cx = React.addons.classSet
var PT = React.PropTypes

var marked = require('marked')
var renderer = new marked.Renderer()
renderer.link = function (href, title, text) {
  return '<a href="' + href + '" target="_blank" title="' + title + '">' + text + '</a>';
}

marked.setOptions({
  gfm: true,
  sanitize: true,
  tables: true,
  breaks: true,
  pedantic: false,
  smartLists: true,
  smartypants: true,
  renderer: renderer
})

var DefaultRenderer = React.createClass({
  render: function () {
    return <span className="treed_body_rendered"
      onClick={this.props.onClick}
      dangerouslySetInnerHTML={{
        __html: this.props.content ?  marked(this.props.content + '') : ''
      }}/>
  }
})

module.exports = DefaultRenderer

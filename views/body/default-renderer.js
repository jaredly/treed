
var React = require('react')
var cx = require('classnames')
var PT = React.PropTypes

var marked = require('marked')
var renderer = new marked.Renderer()
renderer.link = function (href, title, text) {
  return '<a href="' + href + '" target="_blank" title="' + title + '">' + text + '</a>';
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

marked.setOptions({
  gfm: true,
  // sanitize: true,
  tables: true,
  breaks: true,
  pedantic: false,
  smartLists: true,
  smartypants: true,
  renderer: renderer
})

const emojis = {
  ':?:': '❓',
  ':t:': '💭',
  ':":': '❝',
  ':i:': '💡',
  ':?!:': '🗣',
  ':)': '🙂',
  ':P': '😛',
  ':D': '😀',
  ':/': '😕',
  ':(': '🙁',
  ';)': '😉',
  '>.<': '😣',
  ':p:': '🎉',
}

const emoji_names = {
  party: '🎉',
}

const emojiRegexes = Object.keys(emojis)
  .map(k => [new RegExp('\\B' + escapeRegExp(k) + '\\B', 'g'), emojis[k]]);

const replaceReduce = (text, [rx, emo]) => text.replace(rx, emo)

const replaceEmojis = text => {
  return emojiRegexes.reduce(replaceReduce, text)
}

var DefaultRenderer = React.createClass({
  _onClick(e) {
    if (e.target.nodeName === 'A') return
    this.props.onClick(e)
  },
  render: function () {
    return <span className="treed_body_rendered"
      onClick={this._onClick}
      dangerouslySetInnerHTML={{
        __html: this.props.content ?  marked(replaceEmojis(this.props.content + '')) : ''
      }}/>
  }
})

module.exports = DefaultRenderer

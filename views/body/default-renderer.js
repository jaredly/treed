
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
  ':!:': '❗️',
  ':+1:': '👍',
  ':-1:': '👎',
  ':f:': '🔥',
  ':100:': '💯',
  ':t:': '💭',
  ':":': '❝',
  ':i:': '💡',
  ':?!:': '🗣',
  ':)': '🙂',
  ':P': '😛',
  ':D': '😀',
  ':/': '😕',
  ':(': '🙁',
  ':|': '😐',
  ':umok:': '🙃',
  ';)': '😉',
  '>.<': '😣',
  ':p:': '🎉',
}

const emojiRx = new RegExp(Object.keys(emojis).map(k => emojis[k]).join('|'))

// TODO use these
const emoji_names = {
  party: '🎉',
  tada: '🎉',
}

const emojiRegexes = Object.keys(emojis)
  .map(k => [new RegExp('(\\s|^)' + escapeRegExp(k) + '\\s', 'g'), emojis[k]]);

const replaceReduce = (text, [rx, emo]) => text.replace(rx, t => (t[0] === ' ' ? t[0] : '') + emo + t.slice(-1))

const replaceEmojis = text => {
  return emojiRegexes.reduce(replaceReduce, text)
}

const enlargeEmojis = text => {
  return text.replace(emojiRx, x => '<span class="inline-emoji">' + x + '</span>')
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
        __html: this.props.content ?  enlargeEmojis(marked(replaceEmojis(this.props.content + ''))) : ''
      }}/>
  }
})

module.exports = DefaultRenderer

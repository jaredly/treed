
var React = require('react')

var Textarea = React.createClass({

  getCursorSplit: function () {
    var a = this.refs.area
    return a.selectionEnd
  },

  // -1 at end
  // 0 at start
  // 1 no content
  // 2 selection not collapsed
  // 3 somewhere in the middle
  getCursorPos: function () {
    var a = this.refs.area
    if (a.selectionStart !== a.selectionEnd) {
      return 2
    }
    if (!a.value.length) return 1
    if (a.selectionStart === 0) return 0
    if (a.selectionStart === a.value.length) return -1
    return 3
  },

  // 0 == start
  // -1 == end
  // 1 == there's only one line
  // 2 == middle somewhere
  getCursorLine: function () {
    var s = this.refs.shadow
      , a = this.refs.area
      , style = window.getComputedStyle(s)
      , lineHeight = this._fontSize / .875
    if (s.getBoundingClientRect().height - parseInt(style.paddingTop) - parseInt(style.paddingBottom) <= lineHeight * 1.5) {
      // single line
      return 1
    }
    if (a !== document.activeElement) return 2
    if (a.selectionStart !== a.selectionEnd) return 2
    if (a.selectionStart === 0) return 0
    if (a.selectionEnd === this.props.value.length) return -1
    var t = s.firstChild.nodeValue
      , bt = this.props.value.slice(0, a.selectionStart)
      , at = this.props.value[a.selectionStart]
    if (at !== ' ' && at !== '\n' && at) {
      bt += this.props.value.slice(a.selectionStart).match(/[^\s]+/)[0]
    }
    s.firstChild.nodeValue = bt + ' '
    var h = s.getBoundingClientRect().height
    s.firstChild.nodeValue = t
    if (h <= lineHeight * 1.5) return 0
    var full = a.getBoundingClientRect().height
    if (full - lineHeight * .5 < h) {
      return -1
    }
  },

  resize: function () {
    var shadow = this.refs.shadow
      , area = this.refs.area
    var style = window.getComputedStyle(shadow)
    this._fontSize = parseInt(style.fontSize, 10)
    area.style.height = style.height
    // var h = this.refs.shadow.getDOMNode().getBoundingClientRect().height
    // if (h < this.props.fontSize / .875) h = this.props.fontSize / .875
    // this.refs.area.getDOMNode().style.height = h + 'px'
  },

  componentDidUpdate: function () {
    this.resize()
  },

  componentDidMount: function () {
    this.resize()
    window.addEventListener('resize', this.resize)
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.resize)
  },

  blur: function () {
    var inp = this.refs.area
    inp.blur()
  },

  isFocused: function () {
    return this.refs.area === document.activeElement
  },

  focus: function (at) {
    var inp = this.refs.area
      , pos = 0
    if (at === 'end' || !at) pos = inp.value.length
    if ('number' === typeof at) {
      pos = at
    }
    if (inp !== document.activeElement) inp.focus()
    if (at === 'change') {
      inp.selectionStart = 0
      inp.selectionEnd = inp.value.length
    } else {
      inp.selectionStart = inp.selectionEnd = pos
    }
  },

  render: function () {
    return <div className={
      'textarea-grow ' + this.props.className
    }>
      <textarea
        ref='area'
        className='body_input'
        {...this.props}
        />
      <div
        ref='shadow'
        className='shadow'>
        {this.props.value + ' '}
      </div>
    </div>
  }
})

module.exports = Textarea


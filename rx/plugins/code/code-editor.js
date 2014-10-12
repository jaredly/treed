
var React = require('treed/node_modules/react/addons')
  , CodeMirror = require('codemirror')
  , cx = React.addons.classSet
  , PT = React.PropTypes

require('codemirror/mode/javascript/javascript')
require('codemirror/mode/python/python')
require('codemirror/mode/clojure/clojure')
require('codemirror/mode/julia/julia')
require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/hint/show-hint')

var CodeEditor = React.createClass({
  propTypes: {
    node: PT.object,
    value: PT.string,
    onBlur: PT.func,
    onFocus: PT.func,
    onChange: PT.func,
    onKeyDown: PT.func,
    onFOcus: PT.func,
    goDown: PT.func,
    goUp: PT.func,
  },

  focus: function (atStart) {
    if (!this._cm.hasFocus()) {
      this._cm.focus()
      if (!atStart) {
        this._cm.setCursor(this._cm.lineCount(), 0)
      } else {
        this._cm.setCursor(0, 0)
      }
    }
  },

  _onKeyDown: function (editor, e) {
    if (!this.isMounted()) return
    if (editor.state.completionActive) {
      return
    }
    if (e.keyCode === 9) return
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      return this.props.onKeyDown && this.props.onKeyDown(e)
    }
    if (e.keyCode === 38) { // up
      // if (editor.getCursor().line === 0) {
      var curs = editor.getCursor()
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp()
      }
    } else if (e.keyCode === 37) { // left
      var curs = editor.getCursor()
      if (curs.line === 0 && curs.ch === 0) {
        return this.props.goUp()
      }
    } else if (e.keyCode === 40) { // down
      // if (editor.getCursor().line === editor.lineCount() - 1) {
      var curs = editor.getCursor()
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown()
      }
    } else if (e.keyCode === 39) { // right
      var curs = editor.getCursor()
      if (curs.line === editor.lineCount() - 1 && curs.ch === editor.getLine(curs.line).length) {
        return this.props.goDown(true)
      }
    }
    if (this.props.onKeyDown) this.props.onKeyDown(e)
  },

  componentDidMount: function () {
    function betterTab(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add");
      } else {
        cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
          Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
      }
    }

    this._cm = CodeMirror(this.getDOMNode(), {
      value: this.props.value,
      lineNumbers: false,
      matchBrackets: true,
      autoCloseBrackets: '()[]{}""',
      indentUnit: 2,
      indentWithTabs: false,
      tabSize: 2,
      lineWrapping: true,
      mode: this.props.language || this.props.node.language,
      viewportMargin: Infinity,
      extraKeys: { Tab: betterTab },
    })
    this._cm.on('keydown', this._onKeyDown)
    this._cm.on('change', (editor) => {
      if (!this.isMounted()) return
      if (this.props.onChange) this.props.onChange(editor.getValue())
    })
    this._cm.on('focus', () => {
      if (!this.isMounted()) return
      if (this.props.onFocus && this.props.blurred) this.props.onFocus()
    })
    this._cm.on('blur', () => {
      if (!this.isMounted()) return
      if (this.props.onBlur && !this.props.blurred) this.props.onBlur()
    })
    if (!this.props.blurred) {
      this._cm.focus()
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (this._cm.getValue() !== nextProps.value) {
      this._cm.setValue(nextProps.value)
    }
    /*
    if (!nextProps.blurred && !this._cm.hasFocus()) {
      this._cm.focus()
    }
    */
  },

  render: function () {
    return <div/>
  }
})

module.exports = CodeEditor


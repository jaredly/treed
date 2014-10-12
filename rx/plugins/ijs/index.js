
var CodeEditor = require('../code/code-editor')
  , evalScoped = require('./eval')
  , cx = require('react/addons').addons.classSet

var theScope = {}

module.exports = {
  store: {
    actions: {
      execute: function (id) {
        if (!arguments.length) id = this.view.active
        var node = this.db.nodes[id]

        // track where to refocus
        var refocus
        if (this.view.mode === 'insert') {
          refocus = document.activeElement
          document.activeElement.blur()
        }

        if (node.type !== 'ijs') return
        var output = [], error = null
        try {
          evalScoped(node.content, output, theScope)
        } catch (e) {
          error = {
            name: e.name,
            message: e.message,
            stack: e.stack
          }
        }

        setTimeout(() => {
          this.update(id, {
            finished: Date.now(),
            executed: node.content,
            output: output.length > 1 ? output.filter(i => 'undefined' !== typeof i) : output,
            error: error,
          })
        }, 0);

        if (refocus) {
          refocus.focus()
          this.setMode('insert')
        }
      },
    }
  },

  keys: {
    'execute': {
      normal: 'shift+return',
      insert: 'shift+return',
    },
  },

  types: {
    ijs: 'j'
  },

  node: {
    bodies: {
      ijs: {
        renderer: function () {
          return CodeEditor({
            ref: "text",
            language: 'javascript',
            blurred: true,
            node: this.props.node,
            value: this.props.node.content,
            onFocus: this._onClick,
          })
        },
        editor: function (props) {
          props.language = 'javascript'
          return CodeEditor(props)
        },
      }
    },
    blocks: {
      belowbody: function (node, actions, state) {
        if (node.type !== 'ijs') return
        var className = cx({
          'm_IJS': true,
          'm_IJS-hiding': node.display_collapsed,
          'm_IJS-empty': !(node.output && node.output.length),
        })
        return <div className={className} ref='ijs_view' onClick={actions.setActive.bind(actions, node.id)}>
          {make_outputs(node.output, node.error)}
          {/*showTimes(node, state.kernelSession)*/}
        </div>
      },
    },
  }
}

function safeString(val) {
  try {
    return JSON.stringify(val, null, 2)
  } catch (e) {}
  return val + ''
}

function make_outputs(out, err) {
  var res = []
  if (out) {
    res = res.concat(out.map((val, i) => <pre key={'out-' + i}>{safeString(val)}</pre>))
  }
  if (err) {
    res.push(err && <pre>{err}</pre>);
  }
  return res
}


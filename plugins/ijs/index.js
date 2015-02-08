
var CodeEditor = require('../code/code-editor')
  , evalScoped = require('./eval')
  , cx = require('react/addons').addons.classSet
  , uuid = require('../../../lib/uuid')

var theScope = {}
  , session = uuid()

module.exports = {
  store: {
    actions: {

      executeMany: function () {
        if (this.view.mode !== 'visual') return
        this.view.selection.forEach(this.execute.bind(this))
      },

      display: function (id, value, mime) {
      },

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
          output = evalScoped(node.content, output, theScope)
        } catch (e) {
          error = {
            name: e.name,
            message: e.message,
            stack: e.stack
          }
        }

        output = output.map(val => {
          if (['object', 'function'].indexOf(typeof val) === -1) {
            return {'text/plain': safeString(val), 'value': val}
          }
          var ret = {value: val}
          if (val.__treed_display) {
            ret = val
          } else {
            ret['text/plain'] = safeString(val)
          }
          return ret
        })

        setTimeout(() => {
          this.update(id, {
            finished: Date.now(),
            executed: node.content,
            output: output,
            session: session,
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
      normal: 'shift+enter',
      insert: 'shift+enter',
    },
    'execute many': {
      visual: 'shift+enter',
    },
  },

  types: {
    ijs: 'j'
  },

  node: {
    classes: function (node, state) {
      if (node.type !== 'ipython') return
      return cx({
        'TreeItem-ijs-stale': node.session !== session,
        'TreeItem-ijs-dirty': node.executed !== node.content,
      })
    },

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
    return JSON.stringify(val, null, 2) + ''
  } catch (e) {}
  try {
    return val + ''
  } catch (e) {
    return 'restricted ' + typeof val
  }
}

function make_outputs(out, err) {
  var res = []
  if (out) {
    res = res.concat(out.map(show_output))
  }
  if (err) {
    res.push(err && <pre>{err}</pre>);
  }
  return res
}

var CUSTOM_HANDLERS = {
}

var HANDLERS = {
  'json/link': function (output) {
    return <a href={output.href}
              target='_blank'
              title={output.title}>
              {output.text}
           </a>
  },
  'text/html': output => 'HTML NOT YET SUPPORTED',
  'text/plain': output => <pre>{output}</pre>,
}

function show_output(output, key) {
  if (!output) return false
  for (var name in CUSTOM_HANDLERS) {
    if (output[name]) {
      return CUSTOM_HANDLERS[name](output[name])
    }
  }
  for (var name in HANDLERS) {
    if (output[name]) {
      return HANDLERS[name](output[name])
    }
  }
  return <em>Unknown output type</em>
}


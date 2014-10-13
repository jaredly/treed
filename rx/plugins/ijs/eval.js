
var esprima = require('esprima')
  , escodegen = require('escodegen')

var _iframe
function ensureIframe() {
  if (_iframe) return _iframe
  _iframe = document.createElement('iframe')
  _iframe.style.display = 'none'
  document.body.appendChild(_iframe)
  return _iframe
}

module.exports = function (text, output, scope) {

  var tree = esprima.parse(text);
  var tracker = newScope()

  crawlScope(tree, function (node, scope, parent, param, path) {
    var fn = crawls[node.type]
    if (fn) fn(node, scope, parent, param, path)
  }, tracker, newScope);

  var globals = Object.getOwnPropertyNames(window)
    .concat(['arguments', 'this', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']);

  // fixScope(tracker, tree, globals)

  catchOutputs(tree, '$out')

  var code = escodegen.generate(tree)
  code += ';' + tracker.declared.map(function (name) {
    return 'window.' + name + ' = ' + name + ';'
  }).join('');
  console.log(code)

  var target = ensureIframe().contentWindow

  target.$out = output
  target.eval(code)
}

function scopeName(node) {
  if (node.type === 'FunctionDeclaration') return node.id.name;
  return '<anon>'
}

function newScope(node, path) {
  return {
    path: path,
    name: node && scopeName(node),
    declared: node ? node.params.map(function (n) {return n.name}) : [],
    children: [],
    used: [],
  }
}

var crawls = {
  Identifier: function (node, scope, parent, param, path) {
    if (parent.type === 'VariableDeclarator') return
    if (parent.type === 'MemberExpression' && param === 'property') return
    if (parent.type === 'CatchClause' && param === 'param') return
    if (parent.type === 'Property' && param === 'key') return
    if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') &&
        (param === 'params' || param === 'id')) return;
    scope.used.push({name: node.name, path: path});
  },
  VariableDeclarator: function (node, scope) {
    scope.declared.push(node.id.name);
  },
  FunctionDeclaration: function (node, scope) {
    scope.declared.push(node.id.name);
  },
}

function fixScope(scope, tree, inherited) {
  var usable = inherited.concat(scope.declared)
  scope.children.forEach(function (child) {
    fixScope(child, tree, usable);
  });
  scope.used.forEach(function (item) {
    if (usable.indexOf(item.name) !== -1) return
      var parent = item.path.slice(0, -1).reduce(function (parent, attr) {
        return parent[attr] || {}
      }, tree);
      var last = item.path[item.path.length-1]
      parent[last] = {
        type: 'MemberExpression',
        object: {type: 'Identifier', name: '$ns'},
        property: parent[last],
        computed: false
      };
  });
}

function getNames(tree) {
  var names = [];
  var fns = {}
  var has = {}
  function add(name) {
    if (has[name]) return
    has[name] = true
    names.push(name);
  }
  crawlScope(tree, function (node) {
    if (node.type === 'VariableDeclarator') {
      add(node.id.name);
    }
    if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier') {
      add(node.left.name);
    }
    if (node.type === 'FunctionDeclaration') {
      fns[node.id.name] = true
      add(node.id.name);
    }
  });
  return {vbls: names, fns: fns}
}

function catchOutputs(tree, outVar) {
  tree.body.forEach(function (node) {
    if (node.type === 'ExpressionStatement' && node.expression.type !== 'AssignmentExpression') {
      node.expression = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: {type: 'Identifier', name: outVar},
          property: {type: 'Identifier', name: 'push'},
        },
        arguments: [node.expression]
      }
    }
  })
}

var crawlBlack = {
  FunctionDeclaration: ['body'],
  FunctionExpression: ['body'],
}

function crawlScope(tree, visitor, scope, newScope, parent, parentParam, path) {
  var black = crawlBlack[tree.type] || [];
    path = path || [];
  visitor(tree, scope, parent, parentParam, path)
  var thisScope
  for (var name in tree) {
    if (black.indexOf(name) !== -1) {
        thisScope = newScope(tree, path)
        scope.children.push(thisScope)
    } else {
        thisScope = scope
    }
    if (Array.isArray(tree[name])) {
      tree[name].map(function (item, i) {
        crawlScope(item, visitor, thisScope, newScope, tree, name, path.concat([name, i]))
      });
    } else if ('object' === typeof tree[name] && tree[name] !== null && tree[name].type) {
      crawlScope(tree[name], visitor, thisScope, newScope, tree, name, path.concat([name]));
    }
  }
}


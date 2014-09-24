
var Breadcrumb = require('./breadcrumb')

module.exports = {
  store: require('./store'),
  node: require('./node'),
  keys: require('./keys'),

  view: {
    blocks: {
      top: function (actions, state, store) {
        return Breadcrumb({
          rebase: actions.rebase.bind(actions),
          pedigree: store.getters.getPedigree()})
      },
    },
  },
}


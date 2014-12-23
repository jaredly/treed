
var Breadcrumb = require('./breadcrumb')

module.exports = {
  store: require('./store'),
  node: require('./node'),
  keys: require('./keys'),

  view: {
    statusbar: function (store) {
      var actions = store.actions
      return Breadcrumb({
        rebase: actions.rebase.bind(actions),
        pedigree: store.getters.getPedigree()
      })
    },

    blocks: {
      top: function (actions, state, store) {
        return Breadcrumb({
          rebase: actions.rebase.bind(actions),
          pedigree: store.getters.getPedigree()})
      },
    },
  },
}


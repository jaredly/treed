
import React from 'react'

var Breadcrumb = require('./breadcrumb')

module.exports = {
  title: 'Zoom In/Out',

  store: require('./store'),
  node: require('./node'),
  keys: require('./keys'),

  view: {
    statusbar: function (store) {
      var actions = store.actions
      return <Breadcrumb
        key="rebase-breadcrumb"
        rebase={actions.rebase.bind(actions)}
        reload={store.getters.getPedigree.bind(store.getters, true)}
        store={store}
      />
    },

    blocks: {
      top: function (actions, state, store) {
        return <Breadcrumb
          key="rebase-breadcrumb"
          rebase={actions.rebase.bind(actions)}
          reload={store.getters.getPedigree.bind(store.getters, true)}
          store={store}
        />
      },
    },
  },
}


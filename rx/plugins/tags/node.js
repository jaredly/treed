/** @jsx React.DOM */

var Tagger = require('./tagger')
var ShowTags = require('./show-tags')

module.exports = {
  classes: function (node, state) {
    if (state.isTagging) return 'm_Tags'
  },

  storeAttrs: function (store, props) {
    return {
      isTagging: store.isTagging(props.id)
    }
  },

  blocks: {
    right: function (node, actions, state, store) {
      if (!state.isTagging) {
        return ShowTags({
          id: node.id,
          tags: node.tags,
          store: store,
        })
      }
      return <Tagger
        fetchTags={() => store.getTags()}
        onDone={(tags) => {
          actions.setTags(node.id, tags)
          actions.normalMode()
        }}
        onCancel={ () => actions.normalMode() }
        />
    }
  }
}



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

  getListeners(props, events) {
    // console.log('getting listeners')
    return [events.nodeViewChanged(props.id)]
  },

  blocks: {
    right: function (node, actions, state, store) {
      // console.log('istagging', store.isTagging, store.view.mode)
      if (store.view.mode !== 'tagging' || store.view.active !== node.id) {
        return <ShowTags
          id={node.id}
          tags={node.tags}
          store={store}
        />
      }
      return <Tagger
        fetchTags={() => store.getTags()}
        tags={node.tags}
        onDone={(tags) => {
          actions.setTags(node.id, tags)
          actions.normalMode()
        }}
        onCancel={ () => actions.normalMode() }
        />
    }
  }
}


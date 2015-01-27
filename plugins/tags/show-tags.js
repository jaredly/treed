/** @jsx React.DOM */

var React = require('react')
  , PT = React.PropTypes

  , TagView = require('./tag-view')
  , Listener = require('../../listener')

var ShowTags = React.createClass({
  propTypes: {
    id: PT.string,
    tags: PT.array,
    store: PT.object,
  },

  mixins: [Listener({
    storeAttrs: (store, props) => {
      return {
        tags: props.tags && props.tags.map((tag) =>
          store.getNode(tag)
        )
      }
    },

    getListeners: function (props) {
      return props.tags ? props.tags.map((id) => 'node:' + id) : []
    },

    // TODO check for real
    shouldGetNew: function (nextProps) {
      return nextProps.tags !== this.props.tags
    },

  })],

  render: function () {
    return <div className='ShowTags'>
      <TagView
        tags={this.state.tags}
        onClick={(node) => this.props.store.actions
                            .rebase(node.id)}/>
      <i className="ShowTags-icon"
        onClick={() => this.props.store.actions.taggingMode(this.props.id)}/>
    </div>
  },
})

module.exports = ShowTags


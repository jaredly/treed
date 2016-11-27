
var React = require('react')
  , PT = React.PropTypes

  , TagView = require('./tag-view')
  , Listener = require('../../listener')

const {css, StyleSheet} = require('aphrodite')

var ShowTags = React.createClass({
  propTypes: {
    id: PT.string,
    tags: PT.array,
    store: PT.object,
  },

  render: function () {
    return <div className={css(styles.container)}>
      <TagView
        tags={this.props.tags}
        onClick={
          // (node) => this.props.store.actions.rebase(node.id)
          () => this.props.store.actions.taggingMode(this.props.id)
        }/>
        {/*<i className="ShowTags-icon"
        onClick={
          () => this.props.store.actions.taggingMode(this.props.id)
        }/>*/}
    </div>
  },
})

module.exports = ShowTags

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: -5,
  },
})

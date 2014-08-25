/** @jsx React.DOM */

var React = require('react')
  , PT = React.PropTypes
  , cx = React.addons.classSet

var TagView = React.createClass({
  propTypes: {
    tags: PT.array,
    onClick: PT.func,
    removing: PT.bool,
  },

  _onClick: function (tag, e) {
    e.preventDefault()
    this.props.onClick(tag)
  },

  render: function () {
    if (this.props.removing) {
    }
    return <ul className={cx({
      "TagView": true,
      'TagView-removing': this.props.removing,
    })}>
      {this.props.tags &&
       this.props.tags.map((tag) =>
        <li
          onClick={this._onClick.bind(null, tag)}
          className={cx({
            'TagView_Tag': true,
            'TagView_Tag-new': true,
          })}>
          {tag.content}
        </li>)}
    </ul>
  },
})

module.exports = TagView


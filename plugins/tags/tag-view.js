
var React = require('react')
  , PT = React.PropTypes
  , cx = require('classnames')

const {css, StyleSheet} = require('aphrodite')

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
    return <ul className={css(styles.container)}>
      {this.props.tags &&
       this.props.tags.length > 0 &&
       this.props.tags.map((tag, i) =>
        <li
          key={i}
          onClick={this._onClick.bind(null, tag)}
          className={css(styles.tag)}>
          {tag}
        </li>)}
    </ul>
  },
})

module.exports = TagView

const styles = StyleSheet.create({
  container: {
    // position: 'absolute',
    // left: '100%',
    // marginLeft: 20,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  tag: {
    fontSize: 8,
    color: 'white',
    backgroundColor: '#00f',
    opacity: .5,
    padding: '0px 3px',
    borderRadius: 3,
    marginRight: 2,
    marginBottom: 2,
  },
})


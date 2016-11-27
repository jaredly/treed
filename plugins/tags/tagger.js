
var React = require('react')
  , PT = React.PropTypes
  , ShowTags = require('./show-tags')

const {css, StyleSheet} = require('aphrodite')

var Tagger = React.createClass({
  propTypes: {
    fetchTags: PT.func,
    onDone: PT.func,
    onCancel: PT.func,
    tags: PT.arrayOf(PT.string),
  },

  getInitialState() {
    return {
      tags: this.props.tags || [],
      adding: '',
    }
  },

  componentDidMount() {
    this._input.focus()
  },

  render: function () {
    return <div className={css(styles.container)}>
      {this.state.tags.map(tag => (
        <div className={css(styles.tag)}>
          {tag}
        </div>
      ))}
      <input
        ref={node => this._input = node}
        onChange={e => this.setState({adding: e.target.value})}
        placeholder="tag name"
        value={this.state.adding}
        className={css(styles.input)}
        onKeyDown={e => {
          if (e.keyCode === 13 || e.keyCode === 9) {
            // return key
            e.preventDefault()
            this.setState({
              tags: this.state.tags.concat([this.state.adding]),
              adding: '',
            })
          }
          if (e.keyCode === 27) { // escape
            e.preventDefault()
            this.props.onDone(this.state.tags)
          }
          if (e.keyCode === 8) { // delete
            if (e.target.selectionStart === e.target.selectionEnd &&
                e.target.selectionStart === 0) {
              e.preventDefault()
              this.setState({tags: this.state.tags.slice(0, -1)})
            }
          }
        }}
        onBlur={() => this.props.onDone(this.state.tags)}
      />
    </div>
  },
})

module.exports = Tagger

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'row-wrap',
    position: 'absolute',
    right: 0,
    top: -5,
    zIndex: 2000,
  },

  tag: {
    padding: '0px 3px',
    borderRadius: 3,
    backgroundColor: '#00f',
    opacity: .5,
    color: 'white',
    marginRight: 2,
    fontSize: 8,
  },

  input: {
    padding: '2px 5px',
    border: '1px solid #ccc',
    borderRadius: 3,
    fontSize: 8,
  },
})


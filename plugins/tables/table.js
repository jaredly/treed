const React = require('react')
const {css, StyleSheet} = require('aphrodite')
const keys = require('./keys')
const tableEditPos = require('./tableEditPos')

type Props = {
  node: object,
  isActive: boolean,
  editState: 'start' | 'end' | false,
  actions: object,
  store: object,
}

module.exports = class TableComponent extends React.Component {
  constructor(props) {
    super()
    this.state = {
      tmpContents: 0,
      pos: {row: 0, col: 0},
    }
    this.keys = keys(props.actions)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.editState !== prevProps.editState && this.props.editState && this.props.editState !== 'default') {
      this.setState({pos: tableEditPos(this.props.editState, this.props.node.table)})
    }
    if (this.props.editState && document.activeElement !== this._container) {
      this._container.focus()
    } else if (!this.props.editState) {
      this._container.blur()
    }
  }

  componentWillUnmount() {
    this._unmounted = true
  }

  onClick = () => {
    if (!this.props.editState) {
      // this.props.actions.setActive(this.props.node.id)
      this.props.actions.edit(this.props.node.id)
    }
  }

  onKeyDown = e => {
    const pos = this.keys(e, this.state.pos, this.props.node)
    if (pos && pos.col !== undefined) {
      this.setState({pos})
    }
  }

  onBlur = () => {
    /*
    if (this.state.content !== this.props.node.content) {
      this.props.actions.setContent(this.props.node.id, this.state.content)
    }
    */

    setTimeout(() => {
      if (!this._unmounted && !this.props.store.view.windowBlur &&
          this.props.isActive && this._container &&
          // TODO change once we have real editing
          this._container.focused) {
        this.props.actions.normalMode()
      }
    }, 80)

  }

  render() {
    if (!this.props.node.table) {
      return <div>Not a table :(</div>
    }
    let pos = this.props.editState && this.state.pos || {row: null, col: null}

    return <div
      ref={node => this._container = node}
      onBlur={this.onBlur}
      onClick={this.onClick}
      onKeyDown={this.onKeyDown}
      tabIndex="0"
      className={css(styles.container)}
    >
      <table className={css(styles.table)}>
      <tbody>
      {this.props.node.table.matrix.map((row, i) => (
        <tr key={i}>
          {row.map((item, j) => (
            <td key={j} className={css(styles.cell,
                i === pos.row &&
                j === pos.col &&
                styles.selectedCell)}>
              {item || `${i} ${j} ${pos.row} ${pos.col}`}
            </td>
          ))}
        </tr>
      ))}
      </tbody>
      </table>
    </div>
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    ':focus': {
      outline: 'none',
    },
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  cell: {
    minHeight: '1em',
    border: '2px dotted #ccc',
  },

  selectedCell: {
    border: '2px solid #5af',
    // backgroundColor: 'red',
  },
})

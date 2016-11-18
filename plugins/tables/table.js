const React = require('react')
const {css, StyleSheet} = require('aphrodite')
const keys = require('./keys')
const keyManager = require('../../lib/keys')
const tableEditPos = require('./tableEditPos')
const handleInputSelection = require('./handleInputSelection')
const tabPos = require('./tabPos')

type Props = {
  node: object,
  isActive: boolean,
  editState: 'start' | 'end' | false,
  actions: object,
  store: object,
}

const newRow = count => {
  const row = []
  for (let i=0; i<count; i++) {
    row.push('')
  }
  return row
}

const tableChange = {
  rowAfter(pos, matrix) {
    return {
      pos: {
        ...pos,
        row: pos.row + 1,
      },
      matrix: matrix.slice(0, pos.row + 1).concat([newRow(matrix[0].length)]).concat(matrix.slice(pos.row + 1)),
    }
  }
}

module.exports = class TableComponent extends React.Component {
  constructor(props) {
    super()
    this.state = {
      tmpContents: '',
      pos: {row: 0, col: 0, mode: 'normal'},
    }

    // setup key bindings
    const keyConfig = {}
    Object.keys(keys.movement).forEach(key => {
      const val = keys.movement[key]
      if (typeof val === 'function') {
        keyConfig[key] = () => {
          const pos = val(this.state.pos, this.props.node.table, this.props.actions)
          if (pos) {
            this.setState({
              pos: {...this.state.pos, ...pos}
            })
          }
        }
      } else {
        keyConfig[key] = () => {
          this.setState({
            pos: {...this.state.pos, ...val},
            tmpContents: val.mode === 'edit' ?
              this.props.node.table.matrix[this.state.pos.row][this.state.pos.col] : null
          })
        }
      }
    })

    Object.keys(keys.modification).forEach(key => keyConfig[key] = () => {
      const {pos, matrix} = keys.modification[key](this.state.pos, this.props.node.table.matrix)
      this.props.actions.set(this.props.node.id, 'table', {matrix})
      this.setState({pos})
    })

    this.keys = keyManager(keyConfig)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.editState !== prevProps.editState && this.props.editState && this.props.editState !== 'default') {
      this.setState({pos: tableEditPos(this.props.editState, this.props.node.table)})
    }
    // TODO make sure this works w/ not being active
    if (this.props.editState && !this.isFocused()) {
      if (this.state.pos.mode === 'edit') {
        this._textarea.focus()
      } else {
        this._container.focus()
      }
    } else if (!this.props.editState) {
      this._container.blur()
    }

    const {editpos} = this.state.pos
    if (!this.props.isActive) return
    if (this.state.pos.mode !== 'edit') return
    if (prevState.pos.mode === 'edit' && prevState.pos.col === this.state.pos.col && prevState.pos.row === this.state.pos.row) return
    if (!this._textarea || this._textarea === document.activeElement) return
    this._textarea.focus()
    handleInputSelection(editpos, this._textarea)
    console.log('editpos', editpos)
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

  saveCellContent() {
    let {matrix} = this.props.node.table
    let {row, col} = this.state.pos
    matrix = matrix.slice(0, row).concat([
      matrix[row].slice(0, col).concat([
        this.state.tmpContents
      ]).concat(matrix[row].slice(col + 1))
    ]).concat(matrix.slice(row + 1))
    this.props.actions.set(this.props.node.id, 'table', {matrix})
  }

  onKeyDown = e => {
    if (this.state.pos.mode === 'edit') {
      if (e.keyCode === 27) {
        e.preventDefault()
        e.stopPropagation()
        this.saveCellContent()
        setTimeout(() => {
          if (!this._unmounted) {
            this.setState({pos: {...this.state.pos, mode: 'normal'}})
          }
        }, 0)
      }
      if (e.keyCode === 9) {
        e.preventDefault()
        e.stopPropagation()
        this.saveCellContent()
        const nextPos = (e.shiftKey ? tabPos.prev : tabPos.next)(this.state.pos, this.props.node.table.matrix)
        if (nextPos) {
          setTimeout(() => {
            if (!this._unmounted) {
              this.setState({
                pos: nextPos,
                tmpContents: this.props.node.table.matrix[nextPos.row][nextPos.col],
              })
            }
          }, 0)
        }
      }
      return
    }
    const result = this.keys(e)
      /*
    if (typeof result === 'string') {
      if (!tableChange[result]) {
        throw new Error('invalid tablechange ' + result)
      }
      const {matrix, pos} = tableChange[result](this.state.pos, this.props.node.table.matrix)
      this.props.actions.set(this.props.node.id, 'table', {matrix})
      this.setState({pos})
      return
    }
    if (result && result.col !== undefined) {
      const pos = result
      if (pos.mode === 'normal' && this.state.pos.mode === 'edit') {
        this.saveCellContent()
      }
      this.setState({
        pos,
        tmpContents: pos.mode === 'edit' ? this.props.node.table.matrix[pos.row][pos.col] : this.state.tmpContents,
      })
    }
    */
  }

  isFocused() {
    return (
      (this._container && this._container === document.activeElement) ||
      (this._textarea && this._textarea === document.activeElement)
    )
  }

  onBlur = () => {
    if (this.state.pos.mode === 'edit' && this._textarea && this._textarea === document.activeElement) {
      return
    }
    /*
    if (this.state.content !== this.props.node.content) {
      this.props.actions.setContent(this.props.node.id, this.state.content)
    }
    */

    setTimeout(() => {
      if (!this._unmounted && !this.props.store.view.windowBlur &&
          this.props.isActive && this._container === document.activeElement) {
        this.props.actions.normalMode()
      }
    }, 80)

  }

  renderCell(contents, selected) {
    if (selected && this.state.pos.mode === 'edit') {
      return <div className={css(styles.cellWrapper)}>
        <input
          className={css(styles.input)}
          ref={node => this._textarea = node}
          value={this.state.tmpContents}
          onChange={e => this.setState({tmpContents: e.target.value})}
        />
      </div>
    }
    // TODO render contents
    return <div className={css(styles.cellWrapper)}>
      <div className={css(styles.cellText)}>{contents}</div>
    </div>
  }

  render() {
    if (!this.props.node.table) {
      return <div ref={node => this._container = node}>Not a table :(</div>
    }
    let pos = this.props.editState && this.state.pos ||
      {row: null, col: null}

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
        <tr key={i} className={css(pos.mode === 'row' && i === pos.row && styles.highlightedRow)}>
          {row.map((item, j) => (
            <td key={j} className={css(
                styles.cell,
                pos.mode === 'col' &&
                j === pos.col &&
                styles.highlightedCell,
                i === pos.row &&
                j === pos.col &&
                (pos.mode === 'edit' ?
                 styles.editCell :
                styles.selectedCell
            ))}>
              {this.renderCell(
                  item,
                  i === pos.row && j === pos.col
              )}
              {/*item || `${i} ${j} ${pos.row} ${pos.col}`*/}
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
    // minHeight: '1em',
    border: '2px dotted #ccc',
  },

  cellWrapper: {
    display: 'flex',
    alignItems: 'stretch',
    padding: '5px 7px 3px',
  },

  cellText: {
    boxSizing: 'border-box',
    minHeight: 24,
    padding: '5px 7px 3px',
  },

  input: {
    boxSizing: 'border-box',
    height: 24,
    width: '100%',
    border: 'none',
    outline: 'none',
  },

  highlightedRow: {
    backgroundColor: '#def',
  },

  highlightedCell: {
    backgroundColor: '#def',
  },

  editCell: {
    border: '2px solid #a5f',
  },

  selectedCell: {
    border: '2px solid #5af',
    // backgroundColor: 'red',
  },
})

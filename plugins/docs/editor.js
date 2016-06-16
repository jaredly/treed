
var React = require('react')
var cx = require('classnames')

var TableEditor = React.createClass({
  componentDidUpdate: function () {
    this.reFocus()
  },
  componentDidMount: function () {
    this.reFocus()
  },
  reFocus: function () {
    if (!this.state.editing) return
    this.getCurrentCell().focus()
  },
  getInitialState: function () {
    return {
      editing: {
        row: 0,
        col: 0,
      }
    }
  },
  getCurrentCell: function () {
    return this.refs['cell:' + this.state.editing.row + ':' + this.state.editing.col]
  },
  startEditing: function (r,c) {
    this.setState({editing: {row: r, col: c}})
  },
  _onBlur: function () {
    this.setState({editing: false})
  },
  _changeCell: function (r, c, e) {
    var data = this.props.value
    data.body[r][c] = e.target.value
    this.props.onChange(data)
  },
  _onKeyDown: function (r, c, e) {
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
    var body = this.props.value.body
    if (e.key === 'ArrowDown') {
      if (r < body.length - 1) {
        return this.startEditing(r + 1, c)
      }
    } else if (e.key === 'ArrowUp') {
      if (r > 0) {
        return this.startEditing(r - 1, c)
      }
    } else if (e.key === 'ArrowLeft') {
      if (c > 0) {
        return this.startEditing(r, c - 1)
      } else if (r > 0) {
        return this.startEditing(r - 1, body[r-1].length - 1)
      }
    } else if (e.key === 'ArrowRight') {
      if (c < body[r].length - 1) {
        return this.startEditing(r, c + 1)
      } else if (r < body.length - 1) {
        return this.startEditing(r + 1, 0)
      }
    } else if (e.key === 'Escape') {
      return this.getCurrentCell().blur()
    }
  },
  makeCell: function (val, r, c) {
    var editing = this.state.editing.row === r &&
                  this.state.editing.col === c
    return  <input
      value={val}
      onChange={this._changeCell.bind(null, r, c)}
      onBlur={this._onBlur}
      onKeyDown={this._onKeyDown.bind(null, r, c)}
      ref={'cell:' + r + ':' + c}
      style={{
        backgroundColor: editing ? 'green' : 'white',
      }}
      onFocus={this.startEditing.bind(null, r, c)}/>
  },
  render: function () {
    var data = this.props.value
      , ed = this.state.editing
      , inHead = ed.section === 'head'
      , inBody = ed.section === 'body'
    return <table>
      <thead>
        {data.body[0].map((val, c) => <th>{this.makeCell(val, 0, c)}</th>)}
      </thead>
      <tbody>
        {data.body.slice(1).map((row, r) => <tr>
          {row.map((cell, c) => <td>
            {this.makeCell(cell, r+1, c)}
          </td>)}
        </tr>)}
      </tbody>
    </table>
  },
  
})

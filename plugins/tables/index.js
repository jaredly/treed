
const React = require('react')
const TableComponent = require('./table')

const changeTable = (self, id, change) => {
  if (self.db.nodes[id].type !== 'table') return
  self.set(id, 'table', change(self.db.nodes[id].table))
}

const tableChanges = {
  addColumn(table, pos, col) {
    return {
      table: table.map(row => row.slice(0, col).concat(['']).concat(row.slice(col))),
      pos: {
        ...pos,
        col: pos.col === col ? pos.col + 1 : pos.col,
      },
    }
  },
  update(table, pos, text) {
    const newt = table.slice()
    newt[pos.row] = newt[pos.row].slice()
    newt[pos.row][pos.col] = text
    return {table: newt, pos}
  },
}

module.exports = {
  types: {
    table: {
      shortcut: '#',
      update(node) {
        return {
          table: node.table || {
            sort: null,
            matrix: [[node.content, ''], ['', '']]
          }
        }
      },
    },
  },

  store: {
    actions: {
      tableMove(id, pos) {
        this.view.editPos = pos
        this.changed(
          this.events.nodeViewChanged(id)
        )
      },

      tableAddColumn(id, index) {
        if (this.db.nodes[id].type !== 'table') return
        // TODO visual mode
        const matrix = this.db.nodes[id].table
        this.set(id, 'matrix', table)
      },
    },
  },

  node: {
    bodies: {
      table: {
        Component: TableComponent,
      },
    },
  },

}




const tabPos = require('./tabPos')

const newRow = count => {
  const row = []
  for (let i=0; i<count; i++) {
    row.push('')
  }
  return row
}

// TODO
// - multi-select?

const deleteCol = (pos, matrix) => {
  if (matrix[0].length <= 1) return {pos, matrix}
  return {
    pos: {
      ...pos,
      mode: 'normal',
      col: pos.col < matrix[0].length - 1 ? pos.col : pos.col - 1,
    },
    matrix: matrix.map(
      row => row.slice(0, pos.col).concat(row.slice(pos.col + 1))
    ),
  }
}

const deleteRow = (pos, matrix) => {
  if (matrix.length <= 1) return {pos, matrix}
  return {
    pos: {
      ...pos,
      mode: 'normal',
      row: pos.row < matrix.length - 1 ? pos.row : pos.row - 1,
    },
    matrix: matrix.slice(0, pos.row).concat(matrix.slice(pos.row + 1)),
  }
}

module.exports = {
  movement: {
    'i': {mode: 'edit', editpos: 'start'},
    'a': {mode: 'edit', editpos: 'end'},
    'c c': {mode: 'edit', editpos: 'change'},
    'shift+v': ({mode}) => mode === 'row' ? {mode: 'normal'} : {mode: 'row'},
    'v': ({mode}) => mode === 'col' ? {mode: 'normal'} : {mode: 'col'},
    'enter': {mode: 'edit', editpos: 'default'},
    'esc': ({mode}, _, actions) => {
      if (mode !== 'normal') {
        return {mode: 'normal', editpos: null}
      }
      actions.normalMode()
    },

    '0': {col: 0},
    '$': (_, {matrix}) => ({col: matrix[0].length - 1}),
    'g g': {row: 0},
    'G': (_, {matrix}) => ({row: matrix.length - 1}),
    '{': {col: 0, row: 0},

    'R': (_, __, actions) => {
      actions.redo()
    },

    'u': (_, __, actions) => {
      actions.undo()
    },

    'h, left, shift+tab': ({col}) => col > 0 ? {col: col - 1} : null,
    'l, right': ({col}, {matrix}) => col < matrix[0].length - 1 ? {col: col + 1} : null,
    'tab': (pos, {matrix}) => tabPos.next(pos, matrix),
    'shift+tab': (pos, {matrix}) => tabPos.prev(pos, matrix),
    'j, down': ({row}, {matrix}, actions) => {
      if (row < matrix.length - 1) {
        return {row: row + 1}
      }
      // actions.goDown()
      // actions.normalMode()
    },
    'k, up': ({row}, _, actions) => {
      if (row > 0) {
        return {row: row - 1}
      }
      // actions.goUp()
      // actions.normalMode()
    },
  },

  modification: {
    'o': (pos, matrix) => ({
      pos: {
        ...pos,
        row: pos.row + 1,
      },
      matrix: matrix.slice(0, pos.row + 1)
        .concat([newRow(matrix[0].length)])
        .concat(matrix.slice(pos.row + 1)),
    }),
    'shift+o': (pos, matrix) => ({
      pos,
      matrix: matrix.slice(0, pos.row)
        .concat([newRow(matrix[0].length)])
        .concat(matrix.slice(pos.row)),
    }),
    'shift+i': (pos, matrix) => ({
      pos,
      matrix: matrix.map(row => (
        row.slice(0, pos.col)
          .concat([''])
          .concat(row.slice(pos.col))
      )),
    }),
    'shift+a': (pos, matrix) => ({
      pos: {
        ...pos,
        col: pos.col + 1,
      },
      matrix: matrix.map(row => (
        row.slice(0, pos.col + 1)
          .concat([''])
          .concat(row.slice(pos.col + 1))
      )),
    }),

    'D': deleteRow,

    'd': (pos, matrix) => {
      if (pos.mode === 'normal') {
        // just clear it
        // TODO maybe have an internal copy/paste? or just use the global one? hmmmm tricky
        matrix = cloneMatrix(matrix)
        matrix[pos.row][pos.col] = ''
        return {pos, matrix}
      }

      if (pos.mode === 'row') {
        return deleteRow(pos, matrix)
      }

      if (pos.mode === 'col') {
        return deleteCol(pos, matrix)
      }
    },

  },
}

const cloneMatrix = matrix => matrix.map(row => row.slice())


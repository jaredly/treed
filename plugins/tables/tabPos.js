
module.exports = {
  next(pos, matrix) {
    if (pos.col < matrix[0].length - 1) {
      return {...pos, col: pos.col + 1, editpos: 'change'}
    }
    if (pos.row < matrix.length - 1) {
      return {...pos, col: 0, row: pos.row + 1, editpos: 'change'}
    }
    return null
  },
  prev(pos, matrix) {
    if (pos.col > 0) {
      return {...pos, col: pos.col - 1, editpos: 'change'}
    }
    if (pos.row > 0) {
      return {...pos, col: matrix[0].length - 1, row: pos.row - 1, editpos: 'change'}
    }
    return null
  },
}



const tableEditPos = module.exports = (editPos, table) => {
  if (!editPos) return null
  if (editPos === 'end') {
    return {col: 0, row: table.matrix.length - 1, mode: 'normal'}
  }

  return {col: 0, row: 0, mode: 'normal'}
}


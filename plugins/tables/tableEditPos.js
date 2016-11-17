
const tableEditPos = module.exports = (editPos, table) => {
  if (!editPos) return null
  if (editPos === 'end') {
    return {col: 0, row: table.matrix.length - 1}
  }
  if (editPos.col !== undefined) {
    return editPos // TODO make sure it's within the range
  }

  return {col: 0, row: 0}
}


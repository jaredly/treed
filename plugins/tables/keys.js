

module.exports = (actions) => {
  return (e, pos, node) => {
    if (!pos) {
      return
    }
    const table = node.table
    let {row, col} = pos
    switch (e.keyCode) {
      case 72:
        if (col > 0) col--
        break
      case 74:
        if (row >= table.matrix.length - 1) {
          return actions.goDown()
        }
        row++
        break
      case 75:
        if (row <= 0) {
          return actions.goUp()
        }
        row--
        break
      case 76:
        if (col < table.cols - 1) col++
        break
      case 27:
        return actions.normalMode()
      default:
        console.log('nope', e.keyCode)
        return
    }
    e.preventDefault()

    return {row, col}
  }
}

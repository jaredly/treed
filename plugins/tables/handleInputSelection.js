
module.exports = (editpos, input) => {
  switch (editpos) {
    case 'start':
      input.selectionStart = input.selectionEnd = 0
      break
    case 'change':
      input.selectionStart = 0
      input.selectionEnd = input.value.length
      break
    case null:
    case 'end':
    case 'default':
    default:
      input.selectionStart = input.selectionEnd = input.value.length
      break
  }
}


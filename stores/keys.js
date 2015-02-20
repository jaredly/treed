
module.exports = {

  modes: {
    // switch modes
    'visual mode': {
      normal: 'v, shift+v',
    },
    'normal mode': {
      title: 'back to normal mode',
      insert: 'escape',
      visual: 'escape, v, shift+v',
    },
  },

  editing: {
    // switch to insert mode
    'edit': {
      normal: 'enter, a, shift+a, f2',
    },
    'edit start': {
      title: 'edit at start',
      normal: 'i, shift+i',
    },
    'change': {
      title: 'replace contents',
      normal: 'c c, shift+c',
      visual: 'c, shift+c',
    },
    'remove': {
      normal: 'd d, shift+d, delete',
      visual: 'd, shift+d, delete',
    },
  },

}


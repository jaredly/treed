
module.exports = {

  'movement (normal/edit mode)': {
    'go up': {
      normal: 'up, k',
    },
    'go down': {
      normal: 'down, j',
    },
    // TODO allow visual mode to span parents/children?
    'go left': {
      normal: 'left, h',
    },
    'go right': {
      normal: 'right, l',
    },
    'go to previous sibling': {
      normal: 'alt+k, alt+up',
    },
    'go to next sibling': {
      normal: 'alt+j, alt+down',
    },
    'go to first sibling': {
      normal: 'shift+[',
    },
    'go to last sibling': {
      normal: 'shift+]',
    },
    'go to top': {
      normal: 'g g, home',
      insert: 'home',
    },
    'go to bottom': {
      normal: 'shift+g, end',
      insert: 'end',
    },
    'page up': {
      normal: 'page-up',
      insert: 'page-up',
    },
    'page down': {
      normal: 'page-down',
      insert: 'page-down',
    },
    'go to last edited': {
      normal: 'g i',
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
    'join down': {
      title: 'join nodes',
      normal: 'shift+j',
      visual: 'shift+j',
    },
    'create after': {
      text: 'o, enter (at end)',
      normal: 'o',
    },
    'create before': {
      normal: 'shift+o',
    },
  },

  'movement (visual mode)': {
    'toggle selection edge': {
      visual: 'o, shift+o',
    },
    'extend to first sibling': {
      visual: 'shift+[',
    },
    'extend to last sibling': {
      visual: 'shift+]',
    },
    // visual mode stuff
    'extend selection down': {
      visual: 'down, j',
    },
    'extend selection up': {
      visual: 'up, k',
    },
  },

  rearrange: {
    // move stuff
    'indent': {
      normal: 'tab, shift+alt+l, shift+alt+right, shift+.',
      insert: 'tab, shift+alt+right',
      visual: 'tab, shift+alt+l, shift+alt+right, shift+.',
    },
    'dedent': {
      normal: 'shift+tab, shift+alt+h, shift+alt+left, shift+comma',
      insert: 'shift+tab, shift+alt+left',
      visual: 'shift+tab, shift+alt+h, shift+alt+left, shift+comma',
    },

    'move down': {
      normal: 'shift+alt+j, shift+alt+down',
      visual: 'shift+alt+j, shift+alt+down',
    },
    'move up': {
      normal: 'shift+alt+k, shift+alt+up',
      visual: 'shift+alt+k, shift+alt+up',
    },

    'move to first sibling': {
      normal: 'ctrl+shift+[',
      visual: 'ctrl+shift+[',
    },
    'move to last sibling': {
      normal: 'ctrl+shift+]',
      visual: 'ctrl+shift+]',
    },
  },

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
}


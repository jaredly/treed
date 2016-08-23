
import React from 'react'
import {StyleSheet, css} from 'aphrodite'

module.exports = {
  title: 'Disable',

  keys: {
    'toggle disabled': {
      normal: '\\',
      visual: '\\',
    },
  },

  store: {
    actions: {
      toggleDisabled(id) {
        if (!arguments.length) id = this.view.active
        this.set(id, 'disabled', !this.db.nodes[id].disabled)
      },
    },
  },

  node: {
    classes(node, state) {
      return node.disabled ? css(styles.disabled) : ''
    },
  },
}

const styles = StyleSheet.create({
  disabled: {
    fontSize: '80%',
    color: '#aaa',
  },
})


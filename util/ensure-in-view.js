
module.exports = ensureInView

const getScrollParent = item => {
  let parent = item.parentNode
  var rx = /(auto|scroll)/
  var st = window.getComputedStyle(parent)
  while (parent.parentNode && !rx.test(st.overflow + st.overflowY) && parent !== document.body) {
    parent = parent.parentNode
    st = window.getComputedStyle(parent)
  }
  return parent
}

function ensureInView(item) {
  var itemBox = item.getBoundingClientRect()
  const parent = getScrollParent(item)
  var parentBox = parent === document.body ? {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        bottom: window.innerHeight,
        right: window.innerWidth,
      } : parent.getBoundingClientRect()
    , height = itemBox.bottom - itemBox.top
    , pHeight = parentBox.bottom - parentBox.top
    , margin = 100
  if (height + margin * 2 > pHeight) {
    margin = 10
  }
  // If the height of the item is larger than the height of the parent, just
  // get it into view
  if (height + margin * 2 > pHeight) {
    if (itemBox.top > parentBox.top + margin) {
      scrollMe(parent, parent.scrollTop + itemBox.top - parentBox.top - margin)
    } else if (itemBox.bottom < parentBox.bottom - margin) {
      scrollMe(parent, parent.scrollTop - (parentBox.bottom - itemBox.bottom - margin))
    }
    return
  }
  var dest
  if (itemBox.top < parentBox.top + margin) {
    dest = parent.scrollTop - (parentBox.top - itemBox.top + margin)
  } else if (itemBox.bottom > parentBox.bottom - margin) {
    dest = parent.scrollTop + itemBox.bottom - parentBox.bottom + margin
  } else {
    return
  }
  if (dest < 0) dest = 0
  if (dest > parent.scrollHeight - parentBox.height) dest = parent.scrollHeight - parentBox.height
  scrollMe(parent, dest)
}

var scrolling = []
  , timers = []

function scrollMe(parent, dest) {
  var ix = scrolling.indexOf(parent)
  if (ix !== -1) {
    clearInterval(timers[ix])
  } else {
    ix = scrolling.length
    scrolling.push(parent)
  }
  if (Math.abs(parent.scrollTop - dest) < 150) {
    parent.scrollTop = dest
    return scrolling.pop()
  }
  var stop = function () {
      var ix = scrolling.indexOf(parent)
      scrolling.splice(ix, 1)
      timers.splice(ix, 1)
      clearInterval(ival)
  }
  var lastPos = null//parent.scrollTop
  var ival = setInterval(function () {
    if (Math.abs(parent.scrollTop - dest) < 5 || parent.scrollTop === lastPos) {
      parent.scrollTop = dest
      return stop()
    }
    // lastPos = parent.scrollTop
    parent.scrollTop += (dest - parent.scrollTop) / 5
  }, 10);
  timers[ix] = ival
}


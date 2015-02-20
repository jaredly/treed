
module.exports = ensureInView

function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  var parent = item.parentNode
  var rx = /(auto|scroll)/
  var st = window.getComputedStyle(parent)
  while (parent.parentNode && !rx.test(st.overflow + st.overflowY) && parent !== document.body) {
    parent = parent.parentNode
    st = window.getComputedStyle(parent)
  }
  var pox = parent === document.body ? {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        bottom: window.innerHeight,
        right: window.innerWidth,
      } : parent.getBoundingClientRect()
    , height = bb.bottom - bb.top
    , pHeight = pox.bottom - pox.top
    , margin = 100
  if (height + margin * 2 > pHeight) {
    margin = 10
  }
  if (height + margin * 2 > pHeight) {
    if (bb.top > pox.top + margin) {
      scrollMe(parent, parent.scrollTop + bb.top - pox.top - margin)
    } else if (bb.bottom < pox.bottom - margin) {
      scrollMe(parent, parent.scrollTop - (pox.bottom - bb.bottom - margin))
    }
    return
  }
  var dest
  if (bb.top < pox.top + margin) {
    dest = parent.scrollTop - (pox.top - bb.top + margin)
  } else if (bb.bottom > pox.bottom - margin) {
    dest = parent.scrollTop + bb.bottom - pox.bottom + margin
  } else {
    return
  }
  if (dest < 0) dest = 0
  if (dest > parent.scrollHeight - pox.height) dest = parent.scrollHeight - pox.height
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


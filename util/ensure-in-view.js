
module.exports = ensureInView

function ensureInView(item) {
  var bb = item.getBoundingClientRect()
  var parent = item.offsetParent
  var rx = /(auto|scroll)/
  var st = window.getComputedStyle(parent)
  while (parent.offsetParent && !rx.test(st.overflow + st.overflowY)) {
    parent = parent.offsetParent
    st = window.getComputedStyle(parent)
  }
  var pox = parent.getBoundingClientRect()
    , height = bb.bottom - bb.top
    , pHeight = pox.bottom - pox.top
    , margin = 100
  if (height + margin * 2 > pHeight) {
    margin = 10
  }
  if (height + margin * 2 > pHeight) {
    if (bb.top > pox.top + margin) {
      scrollMe(parent, bb.top - pox.top - margin)
    } else if (bb.bottom < pox.bottom - margin) {
      scrollMe(parent, -(pox.bottom - bb.bottom - margin))
    }
    return
  }
  if (bb.top < pox.top + margin) {
    scrollMe(parent, -(pox.top - bb.top + margin))
    return
  }
  if (bb.bottom > pox.bottom - margin) {
    // item.scrollIntoView(false)
    scrollMe(parent, bb.bottom - pox.bottom + margin)
  }
}

var scrolling = []
  , timers = []

function scrollMe(parent, by) {
  var ix = scrolling.indexOf(parent)
  if (ix !== -1) {
    clearInterval(timers[ix])
  } else {
    ix = scrolling.length
    scrolling.push(parent)
  }
  var dest = parent.scrollTop + by
  if (Math.abs(parent.scrollTop - dest) < 5) {
    parent.scrollTop = dest
    return scrolling.pop()
  }
  var ival = setInterval(function () {
    if (Math.abs(parent.scrollTop - dest) < 5) {
      parent.scrollTop = dest
      var ix = scrolling.indexOf(parent)
      scrolling.splice(ix, 1)
      timers.splice(ix, 1)
      clearInterval(ival)
      return
    }
    parent.scrollTop += (dest - parent.scrollTop) / 5
  }, 10);
  timers[ix] = ival
}



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
      parent.scrollTop += bb.top - pox.top - margin
    } else if (bb.bottom < pox.bottom - margin) {
      parent.scrollTop -= pox.bottom - bb.bottom - margin
    }
    return
  }
  if (bb.top < pox.top + margin) {
    parent.scrollTop -= pox.top - bb.top + margin
    return
  }
  if (bb.bottom > pox.bottom - margin) {
    // item.scrollIntoView(false)
    parent.scrollTop += bb.bottom - pox.bottom + margin
  }
}


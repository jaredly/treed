
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
  if (bb.top < pox.top + 100) {
    parent.scrollTop -= pox.top - bb.top + 100
    return
    // return item.scrollIntoView()
  }
  if (bb.bottom > pox.bottom - 100) {
    // item.scrollIntoView(false)
    parent.scrollTop += bb.bottom - pox.bottom + 100
  }
}


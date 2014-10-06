
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
  if (bb.top < pox.top) return item.scrollIntoView()
  if (bb.bottom > pox.bottom) {
    item.scrollIntoView(false)
  }
}


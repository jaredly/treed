
module.exports = function slideUp(node, done) {
  /*
  animate(node, {
    height: {
      from: 'current',
      to: 0
    }
  }, done)
  */
  var style = window.getComputedStyle(node)
    , height = style.height
  if (!parseInt(height)) {
    return
  }
  node.style.height = height
  node.style.transition = 'height .2s ease'
  node.style.overflow = 'hidden'

  setTimeout(function () {
    node.style.height = 0
  }, 0)

  node.addEventListener('transitionend', fin)
  function fin() {
    node.removeEventListener('transitionend', fin)
    node.style.removeProperty('transition')
    node.style.removeProperty('height')
    node.style.removeProperty('overflow')
    done()
  }
}

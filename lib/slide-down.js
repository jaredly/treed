
module.exports = function slideDown(node) {
  var style = window.getComputedStyle(node)
    , height = style.height
  if (!parseInt(height)) {
    return
  }
  var speed = parseInt(height) / 700
  node.style.height = 0
  node.style.transition = 'height ' + speed + 's ease'
  node.style.overflow = 'hidden'
  console.log(height)

  setTimeout(function () {
    console.log('y', height)
    node.style.height = height
  }, 0)

  node.addEventListener('transitionend', fin)
  function fin() {
    node.removeEventListener('transitionend', fin)
    node.style.removeProperty('transition')
    node.style.removeProperty('height')
    node.style.removeProperty('overflow')
  }
}


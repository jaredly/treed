
module.exports = {
  up: slideUp,
  down: slideDown,
}

// speed: time to slide 100px
function slideDown(el, speed) {
  speed = speed || .2
  var curh = window.getComputedStyle(el).height
  el.style.transition = 'none'
  el.style.height = 'auto'
  var h = window.getComputedStyle(el).height
  el.style.height = curh
  if (curh === h) return
  el.style.overflow = 'hidden'
  var dur = parseInt(h, 10) * speed / 100
  // trigger reflow
  window.getComputedStyle(el).height
  el.style.transition = 'height ' + dur + 's ease'
  el.style.height = h
  afterTransition(el, function () {
    el.style.overflow = 'visible'
  })
}

// speed: time to slide 100px
function slideUp(el, speed) {
  speed = speed || .2;
  var curh = window.getComputedStyle(el).height
  if (curh === '0') return
  el.style.transition = 'none'
  el.style.height = curh
  var dur = parseInt(curh, 10) * speed / 100
  el.style.overflow = 'hidden'
  // trigger reflow
  window.getComputedStyle(el).height
  el.style.transition = 'height ' + dur + 's ease'
  el.style.height = '0'
  afterTransition(el, function () {
    el.style.overflow = 'hidden'
  })
}

function afterTransition(el, fn) {
  el.addEventListener('transitionend', function done() {
    el.removeEventListener('transitionend', done)
    fn()
  })
}

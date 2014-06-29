
module.exports = DungeonsAndDragons

function findTarget(targets, e) {
  for (var i=0; i<targets.length; i++) {
    if (targets[i].top > e.clientY) {
      return targets[i > 0 ? i-1 : 0]
    }
  }
  return targets[targets.length-1]
}

// Manages Dragging N Dropping
function DungeonsAndDragons(vl, action, findFunction) {
  this.vl = vl
  this.action = action
  this.findFunction = findFunction || findTarget
}

DungeonsAndDragons.prototype = {
  startMoving: function (targets, id) {
    this.moving = {
      targets: targets,
      shadow: this.vl.makeDropShadow(),
      current: null
    }
    this.vl.setMoving(id, true)

    var onMove = function (e) {
      this.drag(id, e)
    }.bind(this)

    var onUp = function (e) {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      this.drop(id, e)
    }.bind(this)

    document.body.style.cursor = 'move'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  },

  drag: function (id, e) {
    if (this.moving.current) {
      this.vl.setDropping(this.moving.current.id, false, this.moving.current.place === 'child')
    }
    var target = this.findFunction(this.moving.targets, e)
    this.moving.shadow.moveTo(target)
    this.moving.current = target
    this.vl.setDropping(target.id, true, this.moving.current.place === 'child')
  },

  drop: function (id, e) {
    this.moving.shadow.remove()
    var current = this.moving.current
    this.vl.setMoving(id, false)
    if (!this.moving.current) return
    this.vl.setDropping(current.id, false, current.place === 'child')
    if (current.id === id) return
    this.action(current.place, id, current.id)
    this.moving = false
  },
}


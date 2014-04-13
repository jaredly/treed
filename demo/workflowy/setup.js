

var bread = document.getElementById('breadcrumb')
var base = document.getElementById('example')
  , data = make_listed(flare_data, undefined, true)
  , ctrl = new WFController(data.id, data.tree, {onBullet: onBullet})
base.appendChild(ctrl.node)


function onBullet(lineage) {
  bread.innerHTML = ''
  lineage.forEach(function (item, i) {
    var d = document.createElement('div')
    d.classList.add('listless__bread')
    bread.appendChild(d)
    d.textContent = item.name
    if (i === lineage.length - 1) {
      d.classList.add('listless__bread--last')
    } else {
      d.addEventListener('mousedown', function () {
        ctrl.actions.clickBullet(item.id)
      })
    }
  })
}



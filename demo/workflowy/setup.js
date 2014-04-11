

var bread = document.getElementById('breadcrumb')
var base = document.getElementById('example')
  , data = make_listed(flare_data, undefined, true)
  , ctrl = new WFController(data.id, data.tree, {onBullet: onBullet})
base.appendChild(ctrl.node)

ctrl.on('bullet', function (id) {
  console.log('bulletme!', id)
})


function onBullet(lineage) {
  bread.innerHTML = ''
  lineage.forEach(function (item) {
    var d = document.createElement('div')
    bread.appendChild(d)
    d.innerText = item.name
    d.addEventListener('mousedown', function () {
      ctrl.actions.clickBullet(item.id)
    })
  })
}



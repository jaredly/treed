
module.exports = function calcPos(root, nodes, width, height, xsep, ysep) {
  var tree = crawl(root, nodes)

  var boxes = calcBoxes(tree, width, height, 100, xsep, 1, ysep)
  var links = []
  relativize(tree, 0, 0)

  return {boxes, links}

  function relativize(node, x, y) {
    var box = boxes[node.id]
    if (node.children && !node.collapsed) node.children.forEach(child => {
      var cb = boxes[child.id]
      links.push({
        x1: box.x + box.width/2,
        y1: box.y + box.height/2,
        x2: cb.x + cb.width/2,
        y2: cb.y + cb.height/2
      })
      relativize(child, box.x, box.y)
    })
    box.x -= x
    box.y -= y
  }

  function crawl(id) {
    return {
      id: id,
      children: nodes[id].collapsed ? null : nodes[id].children.map(crawl),
      width: 100, // todo how do I know sizes?
      // maybe query the DOM? takes a while...
    }
  }
}


function calcBoxes(data, width, height, cellHeight, xsep, pxscale, ysep) {
  xsep = xsep || 0
  var t = d3.layout.tree()
  t.separation(function(a, b){
    return a.width + b.width + (xsep || 0)
  });
  var nodes = t.nodes(data)
  var links = t.links(nodes)

  function nodePos(node) {
    var x = node.x * width
      , y = node.y * height
    return{x:x,y:y}
  }

  var {xscale, ydepth} = findScale(data, xsep)
  var xscale = xscale || 1
  var xs = pxscale, ys = cellHeight
  //console.log(xscale, ydepth)

  var boxes = {}
  nodes.forEach(node => {
    var x = node.x / xscale * pxscale
      , y = node.y * ydepth * (cellHeight + ysep || 0)
    boxes[node.id] = {
      x: x - node.width/2 * xs,
      y: y,
      width: node.width * xs,
      height: ys,
    }
  })
  return boxes
}

function findScale(node, sep) {
  var min = null
    , maxdepth = 1
    , maxwidth = 0
  function getWidth(node, depth) {
    if (min === null || min > 1/node.width) min = 1/node.width
    if (!node.children)return
    if (depth > maxdepth) maxdepth = depth
    for (var i=0; i<node.children.length-1; i++) {
      var a = node.children[i]
        , b = node.children[i+1]
      var sc = (b.x - a.x) / (b.width + a.width + sep * 2) * 2
      if (min === null || sc < min) {
        min = sc
      }
      getWidth(a, depth + 1)
    }
    if (node.children.length) {
      getWidth(node.children[node.children.length-1], depth + 1)
    }
  }
  getWidth(node, 1)
  if (min === null) min = 1/maxwidth
  return {xscale: min, ydepth: maxdepth}
}

/*
function showBoxes() {
  var canv = document.createElement('canvas')
  canv.width=width;
  canv.height=height + 20
  var ctx = canv.getContext('2d')
  ctx.clearRect(0,0,width,height)
  ctx.clearRect(0,0,width,height+20)

  links.forEach(function(link) {
    var st = nodePos(link.source)
      , en = nodePos(link.target)
    ctx.beginPath()
    ctx.moveTo(st.x,st.y)
    ctx.lineTo(en.x,en.y)
    ctx.stroke()
  })

  nodes.forEach(function(node) {
    var x = node.x * width
      , y = node.y * height
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(x - node.width/2 * xs, y, node.width * xs, ys)
    ctx.strokeRect(x - node.width/2 * xs, y, node.width * xs, ys)
  })
  return canv
}
*/

/*
function addDepth(depth, node) {
  node.depth = depth + 1
  node.children && node.children.forEach(addDepth.bind(null, depth+1))
}
function addWidth(node) {
  node.width = parseInt(Math.random() * 5) + 2
  node.children && node.children.forEach(addWidth)
}
*/

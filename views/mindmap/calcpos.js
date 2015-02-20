
module.exports = function calcPos(root, nodes, xsep, ysep, heights) {
  var tree = crawl(root, nodes)

  var {boxes, height, width} = calcBoxes(tree, 100, xsep, 1, ysep)
  var links = []
  var rbox = boxes[root]
    , rx = 0//rbox.x
    , ry = 0//rbox.y
  relativize(tree, rx, ry)

  return {boxes, links, height, width}

  function relativize(node, x, y, collapsed) {
    var box = boxes[node.id]
    if (node.children) node.children.forEach(child => {
      var cb = boxes[child.id]
      if (!collapsed && !node.collapsed) {
        links.push({
          x1: box.x + box.width/2 - rx,
          y1: box.y + box.height/2 - ry,
          x2: cb.x + cb.width/2 - rx,
          y2: cb.y + cb.height/2 - ry,
          id: child.id,
        })
      }
      relativize(child, box.x, box.y, collapsed || node.collapsed)
    })
    /*
    if (collapsed) {
      box.x = 0
      box.y = 0
    } else {
      box.x -= x
      box.y -= y
    }
    */
  }

  function crawl(id) {
    return {
      id: id,
      children: nodes[id].collapsed ? null : nodes[id].children.map(crawl),
      width: heights[id] || 25, // todo how do I know sizes?
      // maybe query the DOM? takes a while...
    }
  }
}


function calcBoxes(data, cellHeight, xsep, pxscale, ysep) {
  xsep = xsep || 0
  var t = d3.layout.tree()
  t.separation(function(a, b){
    return a.width + b.width + (xsep || 0)
  });
  var nodes = t.nodes(data)
  var links = t.links(nodes)

  var {xscale, ydepth} = findScale(data, xsep)
  var xs = pxscale
    , ys = cellHeight
    , height = ydepth * (cellHeight + ysep || 0)
    , width = pxscale / xscale 
  //console.log(xscale, ydepth)

  var boxes = {}
  nodes.forEach(node => {
    var x = node.x * width
      , y = node.y * height
    boxes[node.id] = {
      x: y - node.width/2 * xs,
      y: x,
      height: node.width * xs,
      width: ys,
    }
  })
  return {boxes, width, height}
}

function findScale(node, sep) {
  var min = null
    , maxdepth = 1
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

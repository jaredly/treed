
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .children(function (d) {
      if (!d.hidesChildren && d.children && d.collapsed && d.children.length) {
        d.hidesChildren = true
      }
      return d.collapsed ? null : d.children
    })
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#d3view").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var listed

function start(flare) {
  root = flare;

  var conved = make_listed(flare, undefined, true)
    , main = document.getElementById('editme')
  conved.tree[conved.id].collapsed = false
  listed = new Listed(conved.id, conved.tree, main)

  function setCollapsed(id, doCollapse) {
    listed.ctrl.setCollapsed(id, doCollapse)
    listed.ctrl.view.startEditing(id)
  }

  var root = listed.ctrl.model.dumpData()
  root.x0 = height / 2;
  root.y0 = 0;
  update(root, setCollapsed);

  listed.ctrl.on('change', function () {
    var root = listed.ctrl.model.dumpData()
    root.x0 = height / 2;
    root.y0 = 0;
    update(root, setCollapsed)
  })
}

d3.select(self.frameElement).style("height", "800px");

var COLORS = {
  done: '#0f0',
  parent: 'lightsteelblue'
}

function update(source, setCollapsed) {

  // Compute the new tree layout.
  var nodes = tree.nodes(source).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
       .data(nodes, function(d) {
         return d.id || (d.id = ++i);
       });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        var _source = d.parent || source
        return "translate(" + _source.y + "," + _source.x + ")";
      })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style('stroke', function (d) {
        return d.hidesChildren ? '' : (d.done ? COLORS.done : '')
      })
      .style("fill", function(d) {
        if (d.done) return COLORS.done
        return d.hidesChildren ? COLORS.parent: "#fff";
      });

  nodeEnter.append("text")
      .attr("x", function(d) { return d.hidesChildren ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.hidesChildren ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

  nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style('stroke', function (d) {
        return d.hidesChildren ? '' : (d.done ? COLORS.done : '')
      })
      .style("fill", function(d) {
        if (d.done) return COLORS.done
        return d.hidesChildren ? COLORS.parent: "#fff";
      });

  nodeUpdate.select("text")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.parent.y + "," + d.parent.x + ")";
      })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var source = d.source
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: d.source.x, y: d.source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Toggle children on click.
  function click(d) {
    setCollapsed(d.id, !d.collapsed)
    /*
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
    */
  }
}

start(flare_data);


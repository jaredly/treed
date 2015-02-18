
var COLORS = {
  done: '#0f0',
  parent: 'lightsteelblue'
}

module.exports = D3Tree

function D3Tree(node, config) {
  config = config || {}
  var margin = config.margin || {top: 20, right: 120, bottom: 20, left: 120},
      width = (config.width || 960) - margin.right - margin.left,
      height = (config.height || 800) - margin.top - margin.bottom;

  this.posmap = {}
  this.width = width
  this.height = height
  this.duration = config.duration || 750
  this.config = config

  this.tree = d3.layout.tree()
      .children(function (d) {
        if (!d.hidesChildren && d.children && d.collapsed && d.children.length) {
          d.hidesChildren = true
        }
        return d.collapsed ? null : d.children
      })
      .size([height, width]);

  var diagonal = this.diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  this.svg = d3.select(node).append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  if (config.data) {
    this.update(config.data)
  }
}

D3Tree.prototype = {
  update: function (data) {
    data.x0 = this.height / 2;
    data.y0 = 0;
    this.posmap[data.id] = {x: data.x0, y: data.y0}
    data.collapsed = false

    var byId = {}
    function crawl(node) {
      byId[node.id] = node
      node.children && node.children.map(crawl)
    }
    crawl(data)


    // Compute the new tree layout.
    var nodes = this.tree.nodes(data).reverse(),
        links = this.tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = this.svg.selectAll("g.node")
        .data(nodes, function(d) {
          return d.id
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => {
          var _source = this.posmap[d.parent ? d.parent.id : d.id] || d.parent || data
          return "translate(" + (_source.y0 || _source.y) + "," + (_source.x0 || _source.x) + ")";
        })

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        // Toggle children on click.
        .on("click", d => this.config.onCollapse(d.id, !d.collapsed))
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
        .text(function(d) { return d.content; })
        .style("fill-opacity", 1e-6)
        .on('click', d => this.config.onClickNode(d.id))

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(this.duration)
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
        .text(function(d) { return d.content; })
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(this.duration)
        .attr("transform", function(d) {
          var source = byId[d.parent.id]
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = this.svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
          var source = d.source
          var o = this.posmap[d.source.id] || {x: source.x0 || source.x, y: source.y0 || source.y};
          return this.diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(this.duration)
        .attr("d", this.diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(this.duration)
        .attr("d", d => {
          var source = byId[d.source.id]
          var o = {x: source.x, y: source.y};
          return this.diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
      this.posmap[d.id] = {x: d.x, y: d.y}
    });
  },
}


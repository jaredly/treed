
module.exports = [
  { content: 'one' },
  {
    content: 'two',
    children: [ {content: 'three'} ]
  }
]

for (var i=0; i<10; i++) {
  var x = {content: 'parent ' + i, children: []}
  for (var j=0; j<10; j++) {
    x.children.push({content: 'j ' + i + ' : ' + j})
  }
  module.exports.push(x)
}

var demoData = {
  "meta": {},
  "content": "Home",
  "children": [
    {
      "meta": {},
      "content": "Animals",
      "type": "base",
      "children": [
        {
          "meta": {},
          "content": "Monkeys",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Marmalutes",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Marsupials",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Meercats",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Moose",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Mice",
          "type": "base"
        }
      ],
      "collapsed": true
    },
    {
      "meta": {},
      "content": "Vegetables",
      "type": "base",
      "children": [
        {
          "meta": {},
          "content": "Trees",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Ferns",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Flowers",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Grass",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Water Lilies",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Plums",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Canteloup",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Cabbage",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Capers",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Carrots",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Camomile",
          "type": "base"
        }
      ],
      "collapsed": true
    },
    {
      "meta": {},
      "content": "Minerals",
      "type": "base",
      "children": [
        {
          "meta": {},
          "content": "Granite",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Pummus",
          "type": "base"
        }
      ],
      "collapsed": true
    },
    {
      "meta": {},
      "content": "Planets",
      "type": "base",
      "children": [
        {
          "meta": {},
          "content": "Mercury",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Venus",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Earth",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Mars",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Jupiter",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Saturn",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Uranus",
          "type": "base"
        },
        {
          "meta": {},
          "content": "Neptune",
          "type": "base"
        }
      ],
      "collapsed": true
    }
  ],
  "collapsed": false
}

if (location.hash === '#real') {
  module.exports = demoData.children
}


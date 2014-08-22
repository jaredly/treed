
module.exports = [
  { content: 'one' },
  {
    content: 'two',
    children: [ {content: 'three'} ]
  }
]

for (var i=0; i<100; i++) {
  module.exports.push({
    content: 'node ' + i
  })
}


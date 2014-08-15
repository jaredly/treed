
module.exports = Tags

function Tags(tags, actions, modelactions) {
  this.actions = actions
  this.modelactions = modelactions
  this.setupNode()
  this.set(tags)
}

Tags.prototype = {
  setupNode: function () {
    this.node = document.createElement('div')
    this.node.className = 'treed__tags'
  },
  set: function (tags) {
    this.value = tags || []
    while (this.node.lastChild) this.node.removeChild(this.node.lastChild);
    this.value.map(function (tag) {
      var node = document.createElement('div')
      node.className = 'treed__tag'
      node.innerHTML = tag.content
      node.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        this.actions.rebase(tag.id)
      }.bind(this))
      this.node.appendChild(node)
    }.bind(this))
  }
}


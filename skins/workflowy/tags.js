
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
    this.node.className = 'treed_tags'

    this.handle = document.createElement('div')
    this.handle.className = 'treed_tags_handle'
    this.handle.addEventListener('click', this.startEditing.bind(this))
    this.handle.innerHTML = '<i class="fa fa-tag"/>'

    this.tags = document.createElement('div')
    this.tags.className = 'treed_tags_list'

    this.node.appendChild(this.handle)
    this.node.appendChild(this.tags)
  },

  startEditing: function (e) {
    e.preventDefault();

  },

  set: function (tags) {
    this.value = tags || []
    while (this.tags.lastChild) this.tags.removeChild(this.tags.lastChild);
    this.value.map(function (tag) {
      var tags = document.createElement('div')
      tags.className = 'treed_tag'
      tags.innerHTML = tag.content
      tags.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        this.actions.rebase(tag.id)
      }.bind(this))
      this.tags.appendChild(tags)
    }.bind(this))
  }
}


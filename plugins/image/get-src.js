
module.exports = getSrc

function getSrc(file, done) {
  if (!file) return
  var reader = new FileReader()
  reader.onload = e => {
    done(e.target.result)
  }
  reader.onerror = e => {
    console.log(e)
  }
  reader.readAsDataURL(file)
}


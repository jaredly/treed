
function eq(a, b) {
  if (a === b) return
  if ('object' === typeof a) {
    if ('object' === typeof b) {
      for (var name in a) {
        if (a[name] !== b[name]) {
          throw new Error('Expected equality: ' + a + ' !== ' + b)
        }
      }
      for (var name in b) {
        if (a[name] !== b[name]) {
          throw new Error('Expected equality: ' + a + ' !== ' + b)
        }
      }
      return
    }
  }
  throw new Error('Expected equality: ' + a + ' !== ' + b)
}

function Tester(target, data) {
  console.log('init', data)
  var loaded = util.make_listed(data)
  this.db = new DumbPL()
  this.model = new WFModel(loaded.id, loaded.tree, this.db)
  this.ctrl = new WFController(this.model) // , {onBullet: this.props.onBreadCrumb})
  this.view = this.ctrl.view
  target.appendChild(this.ctrl.node)
}

Tester.prototype = {
  remove: function () {
    this.ctrl.node.parentNode.removeChild(this.ctrl.node)
  }
}

describe('Something', function () {
  var target = document.getElementById('sandbox')
    , wf = null
  /*
  beforeEach(function () {
    wf = new Tester(target)
  })
  */
  afterEach(function () {
    if (wf) {
      wf.remove()
      delete wf
    }
    wf = null
  })

  it('should instantiate', function () {
    wf = new Tester(target, {
      name: 'Home'
    })
    delete wf
  })

  describe('with some basic data', function () {
    beforeEach(function () {
      wf = new Tester(target, {
        id: 10,
        name: 'Root',
        children: [
          {name: 'First', id: 1},
          {name: 'Second', id: 2},
          {name: 'Third', id: 3},
          {name: 'Fourth', id: 4},
          {
            name: 'Fifth',
            id: 5,
            children: [
              {name: 'Sixth', id: 6},
              {name: 'Seventh', id: 7},
              {name: 'Eight', id: 8}
            ]
          }
        ]
      })
    })

    describe('#goDown', function () {
      it('should go down from root', function () {
        wf.view.goTo(10)
        wf.ctrl.actions.goDown(10)
        eq(wf.view.selection[0], 1)
      })

      it('should go to next sibling', function () {
        wf.view.goTo(2)
        wf.ctrl.actions.goDown(2)
        eq(wf.view.selection[0], 3)
      })
    })

    describe('with one cut', function () {
      beforeEach(function () {
        wf.view.goTo(2)
        wf.ctrl.actions.cut(2)
      })
      it('should select below', function () {
        eq(wf.view.selection[0], 3)
      })
      it('goUp should not touch the deleted one', function () {
        wf.ctrl.actions.goUp(3)
        eq(wf.view.selection[0], 1)
      })
      it('should undo', function () {
        wf.ctrl.actions.undo()
        wf.view.goTo(2)
        eq(wf.view.selection[0], 2)
      })
      it('should redo', function () {
        wf.ctrl.actions.redo()
        eq(wf.view.vl.body(2), undefined)
      })
      it('should paste', function () {
        wf.ctrl.actions.paste(4)
        eq(wf.model.ids[10].children, [1,3,4,100,5])
      })

      describe('having pasted', function () {
        beforeEach(function () {
          wf.ctrl.actions.paste(4)
        })
        it('should undo', function () {
          wf.ctrl.actions.undo()
          // eq(wf.model.ids[10].children, [1,3,4,100,5])
        })
      })
    })
  })
})


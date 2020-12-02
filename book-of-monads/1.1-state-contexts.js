const M = require ('monastic')
const { unchecked: S } = require ('sanctuary')
const daggy = require ('daggy')
const { Do } = require ('../src/utils')

const Tree = daggy.taggedSum ('Tree', {
  Leaf: ['a'],
  Node: ['l', 'r'],
})

const Leaf = x => Tree.Leaf (x)
const Node = x => y => Tree.Node (x, y)

function show (tree) {
  return JSON.stringify (tree, null, 2)
}

//

const example = Node
  (Node
    (Leaf ('x'))
    (Leaf ('y')))
  (Leaf ('z'))

console.log
  (show
    (example))

;(function UsePureAndNext () {
  /**
   * `next` ∷ State Int a → (a → State Int b) → State Int b
   * `pure` ∷ a → State Int a
   */
  const pure = S.of (M.State)
  const next = 'fantasy-land/chain'

  function relabel (t) {
    return t.cata ({
      Leaf: x => M.State (
        i => ({ value: Leaf (S.Pair (i) (x)), state: i + 1 }),
      ),
      Node: (l, r) => relabel (l)[next] (
        ll => relabel (r)[next] (
          rr => pure (Node (ll) (rr)))),
    })
  }

  console.log
    (show
      (M.evalState (0) (relabel (example))))
}) ()

;(function UseDoNotation () {
  const DoM = Do (M.State)

  function relabel (t) {
    return t.cata ({
      Leaf: x => DoM (function * () {
        const i = yield M.get
        yield M.put (i + 1)
        return Leaf (S.Pair (i) (x))
      }),
      Node: (l, r) => DoM (function * () {
        const ll = yield relabel (l)
        const rr = yield relabel (r)
        return Node (ll) (rr)
      }),
    })
  }

  console.log
    (show
      (M.evalState (0) (relabel (example))))
}) ()

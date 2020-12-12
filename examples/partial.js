const { unchecked: S } = require ('sanctuary')
const F = require ('fluture')
const L = require ('partial.lenses')
const R = require ('ramda')

/**
 * Optics = Traversals
 *        | Lenses
 *        | Isomorphisms
 */
const hex2 = S.traverse
  (S.Maybe)
  (S.parseInt (16))
  (['A', 'B', '10'])

const hexs = L.traverse
  (L.fromFantasyMonad (S.Maybe))
  (S.parseInt (16))
  (L.elems)
  (['A', 'B', '10', 'FFF'])

const fut = L.traverse
  (L.fromFantasyMonad (F.Future))
  (x => F.after (500) (S.toUpper (x)))
  ([L.elems, 'foo', 'bar']) // lens
  ([
    { foo: { bar: 'key123' } },
    { foo: { bar: 'key456' } },
    { foo: { bar: 'key789' } },
  ])

const getAccount = address => L.get
  ([L.find (R.whereEq ({ address })), 'account'])
  ([
    { account: 'alice', address: 'alice123' },
    { account: 'bob', address: 'bob456' },
    { account: 'carol', address: 'carol789' },
  ])

const accumulate = _ => L.get
  ([L.groupBy ('address'), L.elems, L.first]) // L.foldTraversalLens (L.collect, L.elems)])
  ([
    { address: 'alice123', amount: 1 },
    { address: 'bob456', amount: 2 },
    { address: 'bob456', amount: 20 },
    { address: 'carol789', amount: 3 },
    { address: 'alice123', amount: 10 },
    { address: 'alice123', amount: 100 },
  ])

console.log (getAccount ('bob456'))
console.log (accumulate ())

console.log ('')

console.log ({ hex2 })
console.log ({ hexs })
F.fork
  (console.error)
  (console.log)
  (fut)

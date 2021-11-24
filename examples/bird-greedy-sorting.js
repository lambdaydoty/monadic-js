const S = require ('sanctuary')

// ∷ (a → b → b) → b → [a] → b
const foldr = op => e => xs => S.reduce_
  (op)
  (e)
  (S.reverse (xs))

// foldr for nonempty list
const foldr1 = op => ([x, ...xs]) => (
  xs.length === 0 ? x : op (x) (foldr1 (op) (xs))
)

// ∷ a → [a] → [[a]]
const inserts = x => S.array
  ([[x]])
  (y => ys => [
    [x, y, ...ys],
    ...S.map (S.prepend (y)) (inserts (x) (ys)),
  ])

const extend = inserts

console.log (extend (1) ([2, 3, 4]))

const tails = S.extend (S.I)

console.log (tails ([1, 2, 3]))

const array = S.unchecked.array ([])

const pairs = xs =>
  S.chain
    (array
      (x => ys => S.map
        (array
          (y => _ => S.Pair (x) (y)))
        (tails (ys))))
    (tails (xs))

// const ic = xs => S.filter (S.pair (S.lt)) (pairs (xs))
const ic = S.pipe ([
  pairs,
  S.filter (S.pair (S.lt)),
  S.size,
])

console.log (ic ([0, 9, 2, 6, 7, 2, 7, 2, 1, 2]))
console.log (ic ([1, 2, 3, 5, 4]))

const step = S.compose (S.chain) (extend)

const perms = foldr (step) ([[]])

console.log (
  perms ([1, 2, 3])
)

const smaller = f => x => y =>
  f (x) < f (y) ? x : y

const miniWith = f => foldr1 (smaller (f))

console.log (
  miniWith (Math.abs) ([3, -4, 5, -6, 2, -1])
)

const sort = S.compose
  (miniWith (ic))
  (perms)

const gstep = x => S.array
  ([x])
  (y => xs => (x <= y) ? ([x, y, ...xs]) : ([y, ...gstep (x) (xs)]))

const isort = foldr (gstep) ([])

console.log (
  isort ([0, 9, 2, 6, 7]),
)
console.log (
  sort ([0, 9, 2, 6, 7]),
)

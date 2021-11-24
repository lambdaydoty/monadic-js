const S = require ('sanctuary')

// ∷ (a → b → b) → b → [a] → b
const foldr = op => e => xs => S.reduce_
  (op)
  (e)
  (S.reverse (xs))

// ∷ a → [a] → [[a]]
const inserts = x => S.array
  ([[x]])
  (y => ys => [
    [x, y, ...ys],
    ...S.map (S.prepend (y)) (inserts (x) (ys)),
  ])

// S.chain ∷ (a → [b]) → [a] → [b]

// ∷ [a] → [[a]]
const perms1 = foldr
  (S.compose (S.chain) (inserts)) // ∷ a → [[a]] → [[a]]
  ([[]])                          // ∷ [[a]]

console.log (perms1 ([1, 2, 3, 4]))

// ∷ [a] → [Pair (a) ([a])]
const picks = S.array
  ([])
  (x => xs => [
    S.Pair (x) (xs),
    ...S.map (S.pair (y => ys => S.Pair (y) ([x, ...ys]))) (picks (xs)),
  ])

// console.log (picks ([1, 2, 3]))
// // => [ Pair (1) ([2, 3]), Pair (2) ([1, 3]), Pair (3) ([1, 2]) ]

const subperms = S.pair (x => ys => S.map (S.prepend (x)) (perms2 (ys)))
const perms2 = xs => S.equals (S.size (xs)) (0) ? ([[]]) :
  S.chain (subperms) (picks (xs))

console.log (perms2 ([1, 2, 3, 4]))

/* until and while */

// const until = p => f => x => p (x) ? x : until (p) (f) (f (x))

// until
//   (x => console.log ({ x }) || x === 1.0)
//   (Math.sqrt)
//   (16)

/* fusion */

// g ∷ a → b
// S.map (g) ∷ [a] → [b]
// f ∷ b → [c]
// S.chain (f) ∷ [b] → [c]
//
// S.compose (S.chain (f)) (S.map (g)) ∷ [a] → [c]
// S.chain (S.compose (f) (g))         ∷ [a] → [c]

// foldr ∷ (b → c → c) → c → [b] → c
// foldr (f) (e) ∷ [b] → c
// S.map (g) ∷ [a] → [b]
// f ∷ b → c → c
// g ∷ a → b
// S.compose (f) (g) ∷ a → c → c
//
// S.compose (foldr (f) (e)) (S.map (g)) ∷ [a] → c
// foldr (S.compose (f) (g)) (e)         ∷ [a] → c

const cons = x => xs => [x, ...xs]
const concat2 = S.flip (foldr (cons))

console.log (concat2 ([1, 2, 3]) ([4, 5, 6, 7, 8]))

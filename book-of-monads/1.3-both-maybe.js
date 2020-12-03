const { unchecked: S } = require ('sanctuary')
// const M = require ('monastic')
// const daggy = require ('daggy')
// const { Do } = require ('../src/utils')

/**
 * Monad as a context
 *
 *   Haskell
 *     return ∷ a → m a
 *     (>>=)  ∷ m a → (a → m b) → m b
 *
 *   JavaScript
 *     S.of (M) ∷ a → m a
 *     S.chain  ∷ (a → m b) → m a → m b
 *     Z.chain  ∷ m a ~> (a → m b) → m b
 *
 * Monad as a box
 *
 *   Haskell
 *     return ∷ a → m a
 *     fmap   ∷ (a → b) → m a → m b
 *     join   ∷ m (m a) → m a
 *
 *   JavaScript
 *     S.of (M) ∷ a → m a
 *     S.map    ∷ (a → b) → m a → m b
 *     S.join   ∷ m (m a) → m a
 */

// ∷ String → Maybe String
const validateName = S.pipe ([
  S.of (S.Maybe),
  S.filter (S.test (/^[\S]+$/)),
])

// ∷ Integer → Maybe Integer
const validateAge = S.pipe ([
  S.of (S.Maybe),
  S.filter (S.gte (1)),
  S.filter (S.lte (17)),
])

;(function plainDispatch () {
  const validatePersion = name => age =>
    S.maybe
      (S.Nothing)
      (nn =>
        S.maybe
          (S.Nothing)
          (aa => S.Just ({ name: nn, age: aa }))
          (validateAge (age)))
      (validateName (name))
  console.log
    (validatePersion
      ('hello')
      (15))
  console.log
    (validatePersion
      ('hello')
      (128))
}) ()

;(function next () {
  const next = 'fantasy-land/chain'
  const validatePersion = name => age =>
    validateName (name)[next] (nn =>
      validateAge (age)[next] (aa =>
        S.Just ({ name: nn, age: aa })))

  console.log
    (validatePersion
      ('hello')
      (15))
  console.log
    (validatePersion
      ('hello')
      (128))
}) ()

const concatMap = xs => f => S.compose (S.join) (S.map (f)) (xs)

console.log
  (concatMap
    ([1, 10])
    (x => [x + 1, x + 2]))

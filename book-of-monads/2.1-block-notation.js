const { unchecked: S } = require ('sanctuary')
const M = require ('monastic')
// const daggy = require ('daggy')
const { Do } = require ('../src/utils')

const next = 'fantasy-land/chain'
const then = S.apSecond
const pure = S.of (M.State)

/**
 *   Haskell
 *     (>>)  ∷ m a → m b → m b
 *    `then`
 *
 *   JavaScript
 *     S.apSecond  ∷ m a → m b → m b
 */

;(function doNotation () {
  const incrCounter = Do (M.State) (function * () {
    const n = yield M.get
    yield M.put (n + 1)
    return n + 1
  })

  console.log
    (M.run
      (100)
      (incrCounter))
}) ()

;(function nextOperator () {
  const incrCounter =
    M.get[next] (n =>
      M.put (n + 1)[next] (_ =>
        pure (n + 1)))

  console.log
    (M.run
      (100)
      (incrCounter))
}) ()

;(function thenOperator () {
  const incrCounter =
    M.get[next] (n =>
      then
        (M.put (n + 1))
        (pure (n + 1)))

  console.log
    (M.run
      (100)
      (incrCounter))
}) ()

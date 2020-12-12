// const { unchecked: S } = require ('sanctuary')
const { Do } = require ('./src/utils')
const F = require ('fluture')
const M = require ('monastic')
const AsyncReader = M.StateT (F.Future)
const {
  get: ask,
  evalState: run,
  lift,
} = AsyncReader

const [unhappy, happy] = [
  x => console.error ('*rejected*') || console.log (x),
  x => console.log ('*resolved*') || console.log (x),
]

/**
 * `If you have to ask, you'll never know.
 *  If you know, you need only ask`
 */

/**
 *
 * lift ∷ Monad m => Monad b → StateT s (m b)
 * hoist ∷ Monad m => StateT s (m a) → (m a → m b) → StateT s (m b)
 */

// ∷ convert ∷ Number → StateT ({ ... }) (Future Error Number)
const convert = btcAmount => Do (AsyncReader) (function * () {
  const { api } = yield ask
  const rate = yield lift ((_ => F.resolve (19614.24)) (api))
  const { currency } = yield ask
  return yield lift (
    currency === 'USD' ? F.resolve (btcAmount * rate * 1) :
    currency === 'NTD' ? F.resolve (btcAmount * rate * 28) :
    /* otherwise */ F.reject (new Error ({ currency })),
  )
})

const compute = convert (2)

const env1 = { api: 'https://crypto', currency: 'NTD' }
// const env2 = { api: 'https://crypto' }

F.fork
  (unhappy)
  (happy)
  (run (env1) (compute))

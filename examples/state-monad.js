const M = require ('monastic')
const { Do } = require ('./src/utils')

// State
const computation = Do (M.State) (function * () {
  const [x, ...xs] = yield M.get
  yield M.put (xs)

  if (x < 4) {
    yield M.modify (s => [4, ...s])
    yield M.modify (s => [5, ...s])
    const [y, ...ys] = yield M.get
    yield M.put (ys)
    return x + y
  } else {
    const [y, ...ys] = yield M.get
    yield M.put (ys)
    return x + y
  }
})

console.log (
  M.run ([3, 2, 1]) (computation),
  M.run ([5, 4, 1]) (computation),
)

// StateT
const F = require ('fluture')
const StateFuture = M.StateT (F.Future)
const { get, put } = StateFuture

const x = Do (StateFuture) (function * () {
  const req = yield get

  const { url } = req

  const pathname = new URL (url).pathname

  const mark = yield pathname === '/query'
    ? StateFuture.lift (F.resolve ('*good*'))
    : StateFuture.lift (F.reject ('*bad*'))

  yield put (Object.assign ({ mark, pathname }, req))

  return yield get
})

F.fork
  (console.error)
  (console.log)
  (StateFuture.evalState ({ url: 'http://api.com/query?foo=bar' }) (x))

const { hoist, lift, put, get, go } = require ('momi')
const { unchecked: S } = require ('sanctuary')
const F = require ('fluture')
const L = require ('partial.lenses')

const control = F.coalesce (S.Left) (S.Right)
const attempt = m => hoist (m) (control)

const addLocals = o => L.modify (['locals', L.valueOr ({})]) (S.concat (o))

const errorToResponse = e => ({
  status: e.status || 500,
  headers: {},
  body: JSON.stringify ({ message: e.message, name: e.name })
})

const fromValidator = validator => go (function * (next) {
  const req = yield get
  const fut = F.node (done => validator (req, {}, done))
  yield lift (fut)
  yield put (req)
  return yield next
})

module.exports = {
  attempt,
  addLocals,
  fromValidator,   // ∷ Validators → Middleware
  errorToResponse, // ∷ Error → Response
}

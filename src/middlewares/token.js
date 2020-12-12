const { go, get, put, lift } = require ('momi')
const F = require ('fluture')
const { unchecked: S } = require ('sanctuary')
const models = require ('../models')
const { BadTokenHeader } = require ('../errors')
// const { Unauthenticated } = require ('../errors')

module.exports = go (function * (next) {
  const req = yield get
  const { locals: { client } } = req
  const token = req.get ('X-Token')
  const { Account } = models (client) ()
  const account = yield lift
    (Account
      .findOne ({ token })
      .pipe (F.mapRej (S.K (new BadTokenHeader ()))))
  yield put (Object.assign ({ account }, req))
  return yield next
})

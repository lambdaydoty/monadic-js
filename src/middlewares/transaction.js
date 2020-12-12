const F = require ('fluture')
const { unchecked: S } = require ('sanctuary')
const { go, get, lift, modify } = require ('momi')
const { attempt, addLocals } = require ('./utils')

module.exports = go (function * (next) {
  const { locals: { client } } = yield get

  const session = client.startSession ()
  session.startTransaction ()
  yield modify (addLocals ({ session }))

  const result = yield attempt (next)

  yield lift (S.isRight (result) ?
    F.node (done => session.commitTransaction (done)) :
    F.node (done => session.abortTransaction (done)))
  yield lift (F.node (done => session.endSession ({}, done)))

  return yield lift (S.either (F.reject) (F.resolve) (result))
})

const express = require ('express')
const F = require ('fluture')
const { unchecked: S } = require ('sanctuary')
const { timing, token, auth, validateAll, transaction } = require ('../../middlewares')
const { clientid } = require ('../../middlewares/validators')
const { Json200 } = require ('../../middlewares/utils')
const models = require ('../../models')
const { isDuplicationError } = require ('../../models/utils')
const { Conflict } = require ('../../errors')

const { connect, go, get, lift } = require ('momi')
const pipe_ = S.compose (S.pipe) (S.reverse)

module.exports = express
  .Router ()
  .get ('/:address/:client_id?', connect (pipe_ ([
    token,
    auth,
    go (function * (/* next */) {
      const req = yield get
      const { locals: { client, currency, account } } = req
      const { params: { address, client_id: id } } = req
      const query = { currency: `${currency}`, account: `${account}` }
      const $address = { $or: [
        { address: { $in: [address, address.toLowerCase ()] } },
        { client_id: id },
      ] }
      const { Address } = models (client) (currency.base ?? currency._id)
      const doc = yield lift (Address.findOne ({ ...query, ...$address }))
      return Json200 (doc)
    })])))
  .post ('/', connect (pipe_ ([
    timing,
    token,
    auth,
    clientid,
    validateAll,
    go (function * (/* next */) {
      const { body: { client_id: id } } = yield get
      return Json200 ({ id, message: 'dry_run_only' })
    })])))
  .post ('/counting', connect (pipe_ ([
    timing,
    token,
    auth,
    clientid,
    validateAll,
    transaction,
    go (accounting),
    go (addressing),
    ])))

function * accounting (next) {
  const { locals: { client, session, account } } = yield get
  const { Account } = models (client) ('')
  const query = { _id: `${account}` }
  yield lift (Account.updateOne (query, { $inc: { count: 1 } }, { session }))
  return yield next
}

function * addressing () {
  const CURRENCY = 'xyz'
  const req = yield get
  const { locals: { client, session, currency, account } } = req
  const { body: { client_id: id } } = req
  const { Address } = models (client) (CURRENCY)
  const query = { currency: `${currency}`, account: `${account}` }
  const values = {
    ...query,
    address: `*:+*:+${id}*:+*:+`,
    client_id: id,
  }
  const fromDuplication = S.when (isDuplicationError) (S.K (new Conflict ()))
  const doc = yield lift
    (Address
      .insertOne (values, { session })
      .pipe (F.mapRej (fromDuplication)))
  return Json200 (doc)
}

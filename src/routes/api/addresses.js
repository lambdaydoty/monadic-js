const express = require ('express')
const { unchecked: S } = require ('sanctuary')
const { timing, token, auth, validateAll, transaction } = require ('../../middlewares')
const { clientid } = require ('../../middlewares/validators')
const models = require ('../../models')

const Json200 = o => ({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify (o),
})

const { connect, go, get, lift } = require ('momi')

module.exports = express
  .Router ()
  .get ('/:address/:client_id?', connect (S.pipe (S.reverse ([
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
    })]))))
  .post ('/', connect (S.pipe (S.reverse ([
    timing,
    token,
    auth,
    clientid,
    validateAll,
    go (function * (/* next */) {
      const { body: { client_id: id } } = yield get
      return Json200 ({ id, message: 'dry_run_only' })
    })]))))
  .post ('/counting', connect (S.pipe (S.reverse ([
    timing,
    token,
    auth,
    clientid,
    validateAll,
    transaction,
    go (accounting),
    go (addressing),
    ]))))

function * accounting (next) {
  const { locals: { client, session, account } } = yield get
  const { Account } = models (client) ('')
  const query = { _id: `${account}` }
  const doc = yield lift (Account.updateOne (query, { $inc: { count: 1 } }, { session }))
  console.log ('@accounting', doc.count)
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
  const doc = yield lift (Address.insertOne (values, { session }))
  console.log ('@addressing', doc._id)
  return Json200 (doc)
}

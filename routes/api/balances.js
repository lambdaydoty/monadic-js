const express = require ('express')
const [F, { middleware, Json }] = [
  require ('fluture'),
  require ('fluture-express'),
]
const { escape, token, auth } = require ('../../middlewares')
const models = require ('../../mongodb/models')

const get = [escape, token, auth]
const Json200 = x => Json (200, x)

module.exports = express
  .Router ()
  .get ('/', [
    ...get,
    middleware ((req, locals) => {
      const { account, client } = locals
      const { Balance } = models (client) ()
      return Balance
        .aggregate ([
          { $match: { account: `${account}` } },
          { $sort: { currency: 1 } },
        ])
        .pipe (F.map (Json200))
    }),
  ])
  .get ('/:currency', [
    ...get,
    middleware ((req, locals) => F.go (function * () {
      const { account, client } = locals
      const { params: { currency: _id } } = req
      const { Currency, Balance } = models (client) ()
      const currency = yield Currency.findOne ({ _id })
      const balance = yield Balance.findOne ({
        currency: `${currency}`,
        account: `${account}`,
      })
      return Json200 (balance)
    })),
  ])

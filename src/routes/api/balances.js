const express = require ('express')
const [F, { middleware, Json }] = [
  require ('fluture'),
  require ('fluture-express'),
]
const { token, auth } = require ('../../middlewares')
const models = require ('../../models')

const get = [token, auth]
const Json200 = x => Json (200, x)

module.exports = express
  .Router ()
  .get ('/', [
    ...get,
    middleware ((req, _) => {
      const { locals: { account, client } } = req
      const { Balance } = models (client) ()
      const pipe = [
        { $match: { account: `${account}` } },
        { $sort: { currency: 1 } },
      ]
      return Balance
        .aggregate (pipe)
        .pipe (F.map (Json200))
    }),
  ])
  .get ('/:currency', [
    ...get,
    middleware ((req, _) => F.go (function * () {
      const { locals: { account, client } } = req
      const { params: { currency: _id } } = req
      const { Currency, Balance } = models (client) ()
      const currency = yield Currency.findOne ({ _id })
      const query = { currency: `${currency}`, account: `${account}` }
      const balance = yield Balance.findOne (query)
      return Json200 (balance)
    })),
  ])

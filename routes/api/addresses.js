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
  .get ('/:address/:client_id?', [
    ...get,
    middleware ((req, locals) => {
      const { account, currency, client } = locals
      const { Address } = models (client) (currency.base || currency._id)
      const { params: { address, client_id: id } } = req
      return Address
        .findOne ({
          currency: `${currency}`, // TODO: btc?
          account: `${account}`,
          $or: [
            { address: { $in: [address, address.toLowerCase ()] } },
            { client_id: id },
          ],
        })
        .pipe (F.map (Json200))
    }),
  ])

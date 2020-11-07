const express = require ('express')
const [F, { middleware, Json }] = [
  require ('fluture'),
  require ('fluture-express'),
]
const { escape, token, auth } = require ('../../middlewares')
const { timing, clientid } = require ('../../middlewares')
const models = require ('../../models')

const get = [escape, token, auth]
const post = [escape, token, auth, timing (), clientid]
const Json200 = x => Json (200, x)

module.exports = express
  .Router ()
  .get ('/:address/:client_id?', [
    ...get,
    timing (),
    middleware ((req, locals) => {
      const { account, currency, client } = locals
      const { Address } = models (client) (currency.base || currency._id)
      const { params: { address, client_id: id } } = req
      const query = { currency: `${currency}`, account: `${account}` }
      return Address
        .findOne ({
          ...query,
          $or: [
            { address: { $in: [address, address.toLowerCase ()] } },
            { client_id: id },
          ],
        })
        .pipe (F.map (Json200))
    }),
  ])
  .post ('/', [
    ...post,
    middleware ((req, locals) => {
      const { body: { client_id: id } } = req
      return F.resolve (Json200 ({ id }))
    }),
  ])

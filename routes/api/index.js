const express = require ('express')
const models = require ('../../mongodb/models')

const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]

module.exports = express
  .Router ()
  .use (require ('./public'))
  .param ('account', dispatcher)
  .use ('/:account', require ('./accounted'))

function dispatcher (req, res, next, _id) {
  const M = middleware ((req, locals) => F.go (function * () {
    const { client } = locals
    const { Account } = models (client) ()
    const account = yield Account.findOne ({ _id })
    Object.assign (req, { account })
    return Next (locals)
  }))
  return M (req, res, next)
}

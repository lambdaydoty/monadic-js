// const { BadTokenHeader, Unauthenticated } = require('../errors')
// const { aw } = require('../utils')
// const Account = require('../models/Account')

const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]

const models = require ('../mongodb/models')

module.exports = middleware ((req, locals) => F.go (function * () {
  const { client } = locals
  const token = req.get ('token')
  const { Account } = models (client) ()
  const account = yield Account.findOne ({ token })
  // return Next ({ ...locals, account })
  Object.assign (req, { account })
  return Next (locals)
}))

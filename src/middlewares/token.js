// const { BadTokenHeader } = require('../errors')
const { Unauthenticated } = require ('../errors')
// const { aw } = require('../utils')
// const Account = require('../models/Account')

const [F, { middleware, Next }, { unchecked: S }] = [
  require ('fluture'),
  require ('fluture-express'),
  require ('sanctuary'),
]

const models = require ('../models')

const HEADER = 'X-Token'

module.exports = middleware ((req, locals) => F.go (function * () {
  const { client } = locals
  const { Account } = models (client) ()
  const token = req.get (HEADER)

  const account = yield Account.findOne ({ token })
    .pipe (F.mapRej (S.K (new Unauthenticated ())))

  Object.assign (req, { account }) // ! State Monad
  return Next (locals)
}))

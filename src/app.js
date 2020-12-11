const F = require ('fluture')
const L = require ('partial.lenses')
const { middleware, Next } = require ('fluture-express')
const { unchecked: S } = require ('sanctuary')

const express = require ('express')
const { catchall } = errorHandlers ()
const { NODE_ENV } = process.env

function log (...args) {
  if (NODE_ENV !== 'jest') return console.error (...args)
}

function saveraw (req, _, buf, encoding) {
  req.raw = buf.toString (encoding)
}

const custom = {
  saveclient (client) {
    return middleware (
      (_, locals) => F.resolve (Next ({ ...locals, client })),
    )
  },
  body () {
    return middleware (
      (_, locals) => {
        // const { body } = req
        return F.resolve (Next (locals))
      },
    )
  },
}

const LOCALS = [L.prop ('locals'), L.valueOr ({})]
const { go, connect, get, put, lift, modify, hoist } = require ('momi')
// connect ∷ Middleware → ((Req, Res, Next) → Unit)
// go ∷ GeneratorFunction → Middleware
// Middleware = StateT[Future a b] → StateT[Future c d]

const { header, validationResult } = require ('express-validator')

function putLocals (req, res, next) {
  const { locals } = res
  Object.assign (req, { locals })
  next ()
}

const fromValidator = validator => go (function * (next) {
  const req = yield get
  const fut = F.node (done => validator (req, {}, done))
  yield lift (fut)
  yield put (req)
  return yield next
})

const queryValidator = fromValidator (
  header ('X-Token')
    .isAlpha ()
)

const validateAll = go (function * (next) {
  const { BadHeader } = require ('./errors')
  const req = yield get
  const formatter = ({ location, msg, param }) => `${location} ${param}: ${msg}`
  const result = validationResult (req).formatWith (formatter)
  if (!result.isEmpty ()) yield lift (F.reject (new BadHeader (`${result.array ()}`)))
  return yield next
})

const token = go (function * (next) {
  const req = yield get
  const token = req.get ('X-Token')
  yield modify (L.modify (LOCALS) (S.concat ({ token })))
  return yield next
})

const echo = go (function * (/* next */) {
  const { locals: { token, client } } = yield get
  console.log (yield lift (F.after (10) ('@echo')))
  console.log (`connection: ${client.isConnected ()}`)
  return {
    status: 200,
    headers: { 'X-Powered-By': 'momi' },
    body: `Hello from momi (token:${token})\n`,
  }
})

const clientid = go (function * (next) {
  const { body: { client_id: id } } = yield get
  yield modify (L.modify (LOCALS) (S.concat ({ client_id: id })))
  return yield next
})

const account = go (function * (next) {
  const { locals: { client, token } } = yield get
  const { Account } = require ('./models') (client) ('')
  yield lift (Account.findOne ({ token }))
  yield modify (L.modify (LOCALS) (S.concat ({ account: 'test' })))
  return yield next
})

const attempt = m => hoist (m) (F.coalesce (S.Left) (S.Right))

const transaction = go (function * (next) {
  const { locals: { client } } = yield get

  const session = client.startSession ()
  session.startTransaction ()

  yield modify (L.modify (LOCALS) (S.concat ({ session })))

  const result = yield attempt (next)

  yield lift (S.isRight (result) ?
    F.node (done => session.commitTransaction (done)) :
    F.node (done => session.abortTransaction (done)))

  yield lift (F.node (done => session.endSession ({}, done)))

  return yield lift (S.either (F.reject) (F.resolve) (result))
  // const errorToResponse = e => ({
  //   status: e.status || 500,
  //   headers: {},
  //   body: JSON.stringify ({message: e.message, name: e.name})
  // })
})

const accounting = go (function * (next) {
  const { locals: { client, session, account } } = yield get
  const { Account } = require ('./models') (client) ('')
  const doc = yield lift (Account.updateOne ({ _id: account }, { $inc: { count: 1 } }, { session }))
  console.log ('@accounting', doc.count)
  return yield next
})

const addressing = go (function * () {
  const currency = 'xyz'
  const { locals: { client, session, client_id: id, account } } = yield get
  const { Address } = require ('./models') (client) ('xyz') // 'xyz' coin
  const doc = yield lift (Address.insertOne ({
    currency,
    account,
    address: `*:+*:+${id}*:+*:+`,
    client_id: id,
  }, { session }))
  console.log ('@addressing', doc._id)
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify (doc),
  }
})

module.exports = {
  create (client/* , keychain */) {
    const app = express ()
      .use ('/api/doc', express.static ('doc'))
      .use (express.json ({ verify: saveraw }))
      .use (custom.saveclient (client))
      .use (custom.body ())
      .use (putLocals)
      .get ('/momi', connect (S.pipe ([echo, token, validateAll, queryValidator])))
      .post ('/transaction', connect (S.pipe (S.reverse ([
        token,
        account,
        clientid,
        transaction,
        accounting,
        addressing ]))))
      .use (require ('./routes'))
      .use (catchall)
    return app
  },
}

function errorHandlers () {
  return ({
    catchall: (error, _, res, __) => {
      const { status = 500, code, message } = error
      if (status >= 500) log (error)
      res
        .status (status)
        .send ({ message, status, code })
        .end ()
    },
  })
}

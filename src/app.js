const [F, { middleware, Next }] = [
  require ('fluture'),
  require ('fluture-express'),
]
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

const { go, connect, get, put, lift } = require ('momi')
// connect ∷ Middleware → ((Req, Res, Next) → Unit)
// go ∷ GeneratorFunction → Middleware

const { header, validationResult } = require ('express-validator')

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
  const result = validationResult (req)
    .formatWith (({ location, msg, param }) => {
      return '' + location + ' ' + param + ': ' + msg
    })
  if (!result.isEmpty ()) yield lift (F.reject (new BadHeader (`${result.array ()}`)))
  return yield next
})

const queryParser = go (function * (next) {
  const req = yield get
  const token = req.get ('X-Token')
  yield put (Object.assign ({ token }, req))
  return yield next
})

const echo = go (function * (/* next */) {
  const { token } = yield get
  console.log (yield lift (F.after (10) ('@echo')))
  return {
    status: 200,
    headers: { 'X-Powered-By': 'momi' },
    body: `Hello from momi (token:${token})\n`,
  }
})

const { unchecked: S } = require ('sanctuary')

module.exports = {
  create (client/* , keychain */) {
    const app = express ()
      .use ('/api/doc', express.static ('doc'))
      .use (express.json ({ verify: saveraw }))
      .use (custom.saveclient (client))
      .use (custom.body ())
      .get ('/momi', connect (S.pipe ([echo, queryParser, validateAll, queryValidator])))
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

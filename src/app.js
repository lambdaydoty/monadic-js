const express = require ('express')
const { catchall } = errorHandlers ()
const { NODE_ENV } = process.env
const { addLocals } = require ('./middlewares/utils')

function log (...args) {
  if (NODE_ENV !== 'jest') return console.error (...args)
}

function saveraw (req, _, buf, encoding) {
  req.raw = buf.toString (encoding)
}

const custom = { saveclient, populatenow }

module.exports = {
  create (client/* , keychain */) {
    const app = express ()
      .use ('/api/doc', express.static ('doc'))
      .use (express.json ({ verify: saveraw })) // prepare... { body }
      .use (custom.saveclient (client))         // prepare... { locals: { client } }
      .use (custom.populatenow ())              // prepare... { locals: { now } }
      .use (require ('./routes'))
      .use (catchall)
    return app
  },
}

function saveclient (client) {
  return (req, _, next) => {
    Object.assign (req, addLocals ({ client }) (req))
    next ()
  }
}

function populatenow () {
  return (req, _, next) => {
    const now = Date.now ()
    Object.assign (req, addLocals ({ now }) (req))
    next ()
  }
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

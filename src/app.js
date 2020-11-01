const express = require ('express')
const { catchall } = errorHandlers ()

const saveraw = (req, res, buf, encoding) => {
  req.raw = buf.toString (encoding)
}

const custom = {
  saveclient (client) {
    const [F, { middleware, Next }] = [
      require ('fluture'),
      require ('fluture-express'),
    ]
    return middleware (
      (req, locals) => F.resolve (Next ({ ...locals, client })),
    )
  },
}

module.exports = {
  create (client, keychain) {
    // console.log ({ keychain })
    const app = express ()
      .use ('/api/doc', express.static ('doc'))
      .use (express.json ({ verify: saveraw }))
      .use (custom.saveclient (client))
      .use (require ('./routes'))
      .use (catchall)
    return app
  },
}

function errorHandlers () {
  return ({
    catchall: (error, req, res, next) => {
      const { status = 500, code, message } = error
      if (status >= 500) console.error (error)
      res
        .status (status)
        .send ({ message, status, code })
        .end ()
    },
  })
}

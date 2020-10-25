/* eslint func-call-spacing: ["error", "always"] */
/* eslint no-multi-spaces: ["error", { ignoreEOLComments: true }] */
const [F, FH, { bootstrap }] = [
  require ('fluture'),
  require ('fluture-hooks'),
  require ('booture'),
]

Object.assign (process.env, {
  GCP_PROJECT_ID: '...',
  GCP_KEY_FILENAME: '....json',
  GCP_SECRET_DB_URI: 'projects/...',
  GCP_SECRET_UNI_KEY: 'projects/...,projects/...',
  PORT: '4242',
})

const {
  GCP_PROJECT_ID,
  GCP_KEY_FILENAME,
  GCP_SECRET_DB_URI,
  GCP_SECRET_UNI_KEY,
  PORT,
} = process.env

const log = (...args) => console.log (...args)

/**
 * NOTE: To close the mongodb client properly, use mongodb@3.6^
 */

/* acquires */

const acquireConfig = F.attempt (_ => ({
  gcp: {
    projectId: GCP_PROJECT_ID,
    keyFilename: GCP_KEY_FILENAME,
    secretNameForDbUrl: GCP_SECRET_DB_URI,
    secretNameForUnikeyWithKMS: GCP_SECRET_UNI_KEY,
  },
  httpServer: {
    port: PORT,
  },
}))

const acquireGcp = ({
  projectId,
  keyFilename,
  secretNameForDbUrl,
  secretNameForUnikeyWithKMS,
}) => F.attemptP (async _ => {
  const R = require ('ramda')
  const { SecretManagerServiceClient } = require ('@google-cloud/secret-manager')
  const { KeyManagementServiceClient } = require ('@google-cloud/kms')

  /* mongodb */

  const secretLens = R.lensPath (['0', 'payload', 'data'])
  const plaintextLens = R.lensPath (['0', 'plaintext'])
  const toString = R.invoker (1, 'toString')

  const url = await new SecretManagerServiceClient ({ projectId, keyFilename })
    .accessSecretVersion ({ name: secretNameForDbUrl })
    .then (R.view (secretLens))
    .then (toString ('utf8'))

  const mongodb = [url, { useNewUrlParser: true, useUnifiedTopology: true }] // [url, options]

  /* pool */

  const [secretNameForUnikey, kms] = secretNameForUnikeyWithKMS.split (',')

  const cipherUnikey = await new SecretManagerServiceClient ({ projectId, keyFilename })
    .accessSecretVersion ({ name: secretNameForUnikey })
    .then (R.view (secretLens))

  const plainUnikey = await new KeyManagementServiceClient ({ projectId, keyFilename })
    .decrypt ({ name: kms, ciphertext: cipherUnikey })
    .then (R.view (plaintextLens))
    .then (toString ('hex'))

  const pool = { key: plainUnikey }

  return { mongodb, pool }
})

const acquireMongodb = ([url, options]) => {
  const R = require ('ramda')
  const { MongoClient } = require ('mongodb')
  function registerEvent (client) {
    const events = ['close', 'error', 'timeout', 'parseError']
    events.forEach (
      event => client.on (event, x => log (`@event:${event}`))
    )
  }
  return F.node (done => MongoClient.connect (url, options, done))
    .pipe (F.map (R.tap (registerEvent)))
}

const closeConnection = client => F.node (done => client.close (false, done))

const acquireApp = (mongodbClient, pool) => F.attempt (_ => {
  return create (mongodbClient, pool)
})

/* bootstrap */

const bootstrappers = Object.values ({
  bootstrapConfig: {
    name: 'config',
    needs: [],
    bootstrap: () => FH.acquire (acquireConfig),
  },

  bootstrapGcp: {
    name: 'gcp',
    needs: ['config'],
    bootstrap: ({ config: { gcp } }) => FH.acquire (acquireGcp (gcp)),
  },

  bootstrapMongodbClient: {
    name: 'mongodbClient',
    needs: ['gcp'],
    bootstrap: ({ gcp: { mongodb } }) => FH.hook (acquireMongodb (mongodb)) (closeConnection),
  },

  bootstrapApp: {
    name: 'app',
    needs: ['mongodbClient', 'gcp'],
    bootstrap: ({ mongodbClient, gcp: { pool } }) => FH.acquire (acquireApp (mongodbClient, pool)),
  },
}) // ∷ [Bootstrapper a b]

const servicesHook = bootstrap (bootstrappers)

const withServices = FH.runHook (servicesHook) // `untagging`: runHook (Hook (h)) = h

const program = withServices (({ app, config }) => F.Future ((rej, res) => {
  const { httpServer: { port } } = config
  const onListen = () => console.log (`Server started at port ${PORT}.`)
  const noop = () => {}

  const server = app.listen (+port, onListen)
  server.once ('error', rej)
  server.keepAliveTimeout = 650 * 1000
  server.headersTimeout = 654 * 1000
  process.once ('SIGINT', res)

  return noop
}))

F.fork (console.error) (console.log) (program)

function create (client, pool) {
  // console.log ({ pool })
  const express = require ('express')
  const { saveraw, catchall } = middlewares ()
  const app = express ()
    .get ('/', (req, res) => res.send ('Hello, world!'))
    .use (express.json ({ verify: saveraw }))
    .use (require ('./routes'))
    .use (catchall)
    .use ('/api/doc', express.static ('doc'))
  return app

  function middlewares () {
    return ({
      saveraw: (req, res, buf, encoding) => {
        req.raw = buf.toString (encoding)
      },
      catchall: (err, req, res, next) => {
        const { status = 500 } = err
        const { message, code } = err
        if (status >= 500) console.error (err)
        res
          .status (status)
          .send ({ message, code })
          .end ()
      },
    })
  }
}

const F = require ('fluture')
const FH = require ('fluture-hooks')
const { bootstrap } = require ('booture')
const R = require ('ramda')

require ('dotenv').config ()

const {
  PORT,
  GCP_PROJECT_ID,
  GCP_KEY_FILENAME,
  GCP_SECRET_DB_URI,
  GCP_SECRET_UNI_KEY,
} = process.env

const log = (...args) => console.log (...args)

/* acquires */

const acquireConfig = F.attempt (_ => ({
  httpServer: { port: PORT },
  gcp: {
    projectId: GCP_PROJECT_ID,
    keyFilename: GCP_KEY_FILENAME,
    secretNameForDbUrl: GCP_SECRET_DB_URI,
    secretNameForUnikeyWithKMS: GCP_SECRET_UNI_KEY,
  },
}))

const acquireGcp = ({
  projectId,
  keyFilename,
  secretNameForDbUrl,
  secretNameForUnikeyWithKMS,
}) => F.attemptP (async _ => {
  const { SecretManagerServiceClient } = require ('@google-cloud/secret-manager')
  const { KeyManagementServiceClient } = require ('@google-cloud/kms')

  /* mongodb */

  const secretLens = R.lensPath (['0', 'payload', 'data'])
  const plaintextLens = R.lensPath (['0', 'plaintext'])
  const toString = R.invoker (1, 'toString')

  const credential = { projectId, keyFilename }

  const url = await new SecretManagerServiceClient (R.clone (credential))
    .accessSecretVersion ({ name: secretNameForDbUrl })
    .then (R.view (secretLens))
    .then (toString ('utf8'))

  const mongodb = { url }

  /* keychain */

  const [secretNameForUnikey, kms] = secretNameForUnikeyWithKMS.split (',')

  const cipherUnikey = await new SecretManagerServiceClient (R.clone (credential))
    .accessSecretVersion ({ name: secretNameForUnikey })
    .then (R.view (secretLens))

  const plainUnikey = await new KeyManagementServiceClient (R.clone (credential))
    .decrypt ({ name: kms, ciphertext: cipherUnikey })
    .then (R.view (plaintextLens))
    .then (toString ('hex'))

  const keychain = { key: plainUnikey }

  return { mongodb, keychain }
})

const acquireMongodb = ({ url }) => {
  const { MongoClient, Decimal128: D128 } = require ('mongodb')

  const options = { useNewUrlParser: true, useUnifiedTopology: true }

  function registerEvent (client) {
    const events = ['close', 'error', 'timeout', 'parseError']
    events.forEach (ev => client.on (ev, _ => log (`@event:${ev}`)))
  }

  function Decimal128 () {
    const BN = require ('bignumber.js')
    const util = require ('util')
    Object.assign (D128.prototype, {
      toJSON () {
        return new BN (this).toFixed ()
      },
      [util.inspect.custom] () {
        return `D128 ("${this.toJSON ()}")`
      },
    })
  }

  Decimal128 ()

  return F.node (done => MongoClient.connect (url, options, done))
    .pipe (F.map (R.tap (registerEvent)))
}

/**
 * NOTE: To close the mongodb client properly, use mongodb@3.6^
 */
const closeConnection = client => F.node (done => client.close (false, done))

const acquireApp = (mongodbClient, keychain) => F.attempt (_ => {
  return require ('./app')
    .create (mongodbClient, keychain)
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
    bootstrap: ({ mongodbClient, gcp: { keychain } }) => FH.acquire (acquireApp (mongodbClient, keychain)),
  },
}) // ∷ [Bootstrapper a b]

const servicesHook = bootstrap (bootstrappers)

const withServices = FH.runHook (servicesHook) // `untagging`: runHook (Hook (h)) = h

const program = withServices (({ app, config }) => F.Future ((rej, res) => {
  const { httpServer: { port } } = config
  const onListen = () => console.log (`Server started at port ${port}.`)
  const noop = () => {}

  const server = app.listen (+port, onListen)
  server.keepAliveTimeout = 650 * 1000
  server.headersTimeout = 654 * 1000
  server.once ('error', rej)
  process.once ('SIGINT', res)

  return noop
}))

F.fork (console.error) (console.log) (program)
